import setInstance from "../src/index";
require('dotenv').config()

/**
 *  测试set方法
 */
test("#Test set function.",  () => {
    console.log(process.env)
    const {
        USER,
        PASSWORD,
        HOST,
        PORT
    } = process.env

    const {set} = setInstance({
        user: USER!,
        password: PASSWORD!,
        host: HOST,
        port: parseInt(PORT!, 10),
        tls: true,
        authTimeout: 3000,
    })
    set("name", "foo")
        .then(() => set("name1", "1") )
        .then(() => set("name2", "2") )
        .then(() => set("name3", "3") )
        .then(() => set("name4", "4") )
        .then(() => console.log("Finised."))
})