const minimist = require('minimist')
const error = require('./utils/error')

module.exports = () => {
    const args = minimist(process.argv.slice(2))

    let cmd = args._[0] || 'help'

    if (args.version || args.v) {
        cmd = 'version'
    }

    if (args.help || args.h) {
        cmd = 'help'
    }

    switch (cmd) {
        case 'create':
            require('./cmds/account').create(args)
            break

        case 'balance':
            require('./cmds/account').getAccount(args)
            break

        case 'audit':
            require('./cmds/account').getAccountAudit(args)
            break

        // case 'changeTrust':
        //     require('./cmds/asset')(args)
        //     break

        // case 'issueAsset':
        //     require('./cmds/asset')(args)
        //     break

        // case 'manageOffer':
        //     require('./cmds/offer')(args)
        //     break

        // case 'getOffer':
        //     require('./cmds/offer')(args)
        //     break

        // case 'lend':
        //     require('./cmds/payment')(args)
        //     break

        // case 'exchange':
        //     require('./cmds/payment')(args)
        //     break

        case 'help':
            require('./cmds/help')(args)
            break

        default:
            error(`"${cmd}" is not a valid command!`, true)
            break
    }
}