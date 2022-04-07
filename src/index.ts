import imap from 'imap'
import {getSubjectByContent, initBox, initCacheFile, pushCacheMessage, setConfig} from "./imapConnection";

const hashData: Record<string, string> = {};

type SetInstanceReturnType = {
    set: typeof set
}

const set = async (name: string, value: string): Promise<void> => {
    await initBox();
    await initCacheFile(getSubjectByContent(hashData));
    hashData[name] = value
    await pushCacheMessage(hashData)
}
const setInstance = (config: imap.Config): SetInstanceReturnType  => {
    setConfig(config)
    return {set}
}

export default setInstance;
