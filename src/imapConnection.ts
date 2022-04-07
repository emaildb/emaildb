import {getHash} from '@wuchuhengTools/helper';
import imap, {ImapSimple, ImapSimpleOptions, Message} from 'imap-simple';
import Imap from 'imap';

let connection: ImapSimple | null = null
const boxName: string = 'Cache';
const deviceMac: string = "123456789";
let hasCacheFile: boolean = false;
let hasInitBoxy: string = '';
const previousMessages: {dateTime: Date, messages: Message[]} = {
    dateTime: new Date(Date.now() - 1000),
    messages: []
}

const imapConfig: Imap.Config = {
    user: '',
    password: '',
    host: '',
    port: 993,
    tls: true,
    authTimeout: 3000,
}
const setConfig = (config: Imap.Config) => {
    imapConfig.user = config.user
    imapConfig.password = config.password ;
    imapConfig.host = config.host;
    imapConfig.port = config.port;
    imapConfig.tls = config.tls;
    imapConfig.authTimeout = config.authTimeout;
}

const config:ImapSimpleOptions = {
    imap: imapConfig,
    onmail: numNewMail => {
        console.log(numNewMail)

    },
    onexpunge: seqno => {
        console.log(seqno)
    },
    onupdate: (seqno, info) => {
        console.log(seqno, info)
    }
};

const getConnection = async (): Promise<ImapSimple> => {
    if (connection !== null) {
        return connection;
    }
    connection = await imap.connect(config)

    return connection
}

const getSubjectByContent = (content: HashCacheType): string => {
    return `cache-${deviceMac}-${getHash(JSON.stringify(content), 'md5')}`;
}

const initBox = async (): Promise<string> => {
    if (hasInitBoxy) return hasInitBoxy;
    const connection = await getConnection()
    const boxes = await connection.getBoxes()
    const onlineBoxName = boxes[boxName]
    !onlineBoxName && await connection.addBox(boxName)
    hasInitBoxy = boxName;

    return boxName;
}

const pushCacheMessage = async (content: HashCacheType): Promise<void> => {
    const subject = getSubjectByContent(content)
    const connection = await getConnection();
    const prefixSubject = subject.split('-').slice(0, 2).join('-')
    let newMessages: Message[] = [];
    if (previousMessages.messages.length > 0) {
        const deleteMessages: Message[] = [];
        newMessages = previousMessages.messages.filter(e => {
            const emailSubject = e.parts[0].body.subject[0].split('-').slice(0, 2).join('-')
            if (emailSubject === prefixSubject) {
                deleteMessages.push(e)
                return false
            }
        })
        await connection.deleteMessage( deleteMessages.map((message): number => message.attributes.uid) )
        previousMessages.messages = newMessages;
        previousMessages.dateTime = new Date();
    }
    const message = `Content-Type: text/plain
From: ${config.imap.user}
Subject: ${subject}

${JSON.stringify(content)}
`;
    await connection.append(message.toString(), {
        mailbox: boxName,
    });
    await fetchAll();
}
const initCacheFile = async (subject: string): Promise<boolean> => {
    try {
        await findMessageBySubject(subject);
    }catch (e) {
        await pushCacheMessage({})
    }
    return true;
}

const findMessageBySubject = async (subject: string): Promise<Message> => {
    const messages = await fetchAll();
    const message = messages.find(m => {
        const emailSubject = m.parts[0].body.subject[0].split('-').slice(0, 2).join('-')
        const findSubject = subject.split('-').slice(0, 2).join('-')

        return emailSubject === findSubject;
    })
    if (!message) {
        throw new Error("Empty record.")
    }

    return message;
}

const fetchAll = async (): Promise<Message[]> => {
    if (Date.now() < previousMessages.dateTime.getTime() + 1000) {
        return previousMessages.messages;
    }
    const connection = await getConnection();
    await connection.openBox(boxName)
    const messages = await connection.search(
        ['ALL'],
        {bodies: `HEADER.FIELDS (SUBJECT BODY)`,  struct: true }
    )
    previousMessages.dateTime = new Date();
    previousMessages.messages = messages;

    return previousMessages.messages;
}

export {
    getConnection,
    initBox,
    pushCacheMessage,
    initCacheFile,
    getSubjectByContent,
    findMessageBySubject,
    fetchAll,
    setConfig
}