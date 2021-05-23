const KFIVE = artifacts.require("KFIVE")
// const Stake = artifacts.require("Stake")

const eq = assert.equal
const u = require('./utils.js')
const oc = u.oc;
const tokenDecimals = 10;
const tokenCap = 1080000;
var kfive, s;

contract("KFIVE", (accounts) => {

    const root = accounts[0]
    const account1 = accounts[1]
    const account2 = accounts[2]
    const evil = accounts[3]
    const new_owner = accounts[4]
    const account5 = accounts[5]
    const account6 = accounts[6]
    const new_admin = accounts[7]
    const account8 = accounts[8]
    const account9 = accounts[9]
    const OFFCHAIN = web3.utils.fromAscii('1')

    before(async () => {
        kfive = await KFIVE.new({
            from: root
        });

        // s = await Stake.new(kfive.address);
    })

    describe('Deployment stage', async () => {
        it('Token information', async () => {
            let o = {
                balance: 0,
                name: 'KFIVE',
                symbol: 'KFIVE',
                decimals: tokenDecimals,
            }

            let owner_balance = await kfive.balanceOf(root, {
                from: root
            });

            eq(o.balance, owner_balance.toString());
            eq(o.name, await kfive.name.call());
            eq(o.symbol, await kfive.symbol.call());
            eq(o.decimals, await kfive.decimals.call());
            o = {
                balance: tokenCap * (10 ** tokenDecimals),
            }

            await kfive.issue(root, o.balance.toString(), OFFCHAIN, { // Issue all token to root
                from: root
            });


            owner_balance = await kfive.balanceOf(root, {
                from: root
            });

            eq(o.balance.toString(), owner_balance.toString());
        })

        it('Token supply', async () => {
            const o = {
                total: tokenCap * (10 ** tokenDecimals),
            }

            let total_supply = await kfive.totalSupply({
                from: root
            });

            eq(o.total, total_supply.toString());
        })
    })

    describe('Issue / Redeem / Mint / Burn stage', async () => {
        it('Issue 10 kfive to account 1 (Cannot because all kfive issued to owner)', async () => {
            const i = {
                issuer: account1,
                value: web3.utils.toHex(10 * (10 ** tokenDecimals)),
            }
            await u.assertRevert(kfive.issue(i.issuer, i.value, OFFCHAIN, {
                from: root
            }));
        })

        it('Redeem 5 kfive from account 1 (onwer call) (Cannot account 1 has no kfive)', async () => {
            const i = {
                redeemer: account1,
                value: web3.utils.toHex(5 * (10 ** tokenDecimals)),
            }
            await u.assertRevert(kfive.redeem(i.redeemer, i.value, OFFCHAIN, {
                from: root
            }));
        })

        it('Redeem 5 kfive from root (account 1 call) - Only owner can call this function', async () => {
            const i = {
                redeemer: root,
                value: web3.utils.toHex(10 * (10 ** tokenDecimals)), // 10 Kfive
            }
            await u.assertRevert(kfive.redeem(i.redeemer, i.value, OFFCHAIN, { // Burn 10 kfive from this issuer
                from: account1
            }))
        })

        it('Redeem token from root', async () => {
            const i = {
                redeemer: root,
                value: web3.utils.toHex(10 * (10 ** tokenDecimals)),
            }

            const o = {
                owner_balance: (tokenCap - 10) * (10 ** tokenDecimals),
                total_supply: (tokenCap - 10) * (10 ** tokenDecimals),
            }

            await kfive.redeem(i.redeemer, i.value, OFFCHAIN, {
                from: root
            });

            let total_supply = await kfive.totalSupply({
                from: root
            });

            let owner_balance = await kfive.balanceOf(root, {
                from: root
            });

            eq(o.total_supply, total_supply.toString());
            eq(o.owner_balance, owner_balance.toString());

        })

        it('Issue 11 kfive to account1 (There are still 10 kfive remaining for issue)', async () => {
            const i = {
                issuer: account1,
                value: web3.utils.toHex(11 * (10 ** tokenDecimals)),
            }

            await u.assertRevert(kfive.issue(i.issuer, i.value, OFFCHAIN, {
                from: root
            }));
        })

        it('Issue 10 kfive to account1 (total supply will be reached)', async () => {
            const i = {
                issuer: account1,
                value: web3.utils.toHex(10 * (10 ** tokenDecimals)),
            }

            const o = {
                owner_balance: (tokenCap - 10) * (10 ** tokenDecimals),
                issuer_balance: 10 * (10 ** tokenDecimals),
                total_supply: tokenCap * (10 ** tokenDecimals),
            }

            await kfive.issue(i.issuer, i.value, OFFCHAIN, {
                from: root
            });


            let total_supply = await kfive.totalSupply({
                from: root
            });

            let owner_balance = await kfive.balanceOf(root, {
                from: root
            });

            let issuer_balance = await kfive.balanceOf(i.issuer, {
                from: root
            });

            eq(o.total_supply, total_supply.toString());
            eq(o.owner_balance, owner_balance.toString());
            eq(o.issuer_balance, issuer_balance.toString());

        })

    })

    describe('Running stage', async () => {
        it('Transfer By Admin (only admin / owner) account 1 -> account 2: 10 Kfive', async () => {
            const i = {
                from: account1,
                to: account2,
                value: web3.utils.toHex(10 * (10 ** tokenDecimals)),
            }

            await u.assertRevert(kfive.transferByAdmin(i.from, i.to, i.value, OFFCHAIN, {
                from: account1
            }));
        })

        it('Transfer By Admin (only admin / owner) account 1 -> account 2: 10 Kfive', async () => {
            const i = {
                from: account1,
                to: account2,
                value: web3.utils.toHex(10 * (10 ** tokenDecimals)),
            }

            await kfive.transferByAdmin(i.from, i.to, i.value, OFFCHAIN, {
                from: root
            });
        })

        it('Transfer: account 2 -> account 1: 10 Kfive', async () => {

            const i = {
                to: account1,
                value: web3.utils.toHex(10 * (10 ** tokenDecimals)),
            }

            await kfive.transfer(i.to, i.value, {
                from: account2
            });

        })

        // Amount of token to given address so he/she (receiver) can use those for transfer
        it('Approve: account1 approve 10 KFIVE to root', async () => {
            await kfive.approve(root, web3.utils.toHex(10 * (10 ** tokenDecimals)), {
                from: account1
            });
        })

        it('Allowance: approved token ammount 10 KFIVE', async () => {
            const o = {
                value: web3.utils.toHex(10 * (10 ** tokenDecimals))
            }

            // var account1_allowance = await kfive.allowance(account1, s.address, {
            //     from: account1
            // });
            // eq(o.value, web3.utils.toHex(account1_allowance));

            account1_allowance = await kfive.allowance(account1, root, {
                from: account1
            });
            eq(o.value, web3.utils.toHex(account1_allowance));
        })

        // using the allowance mechanism. `amount` is then deducted from the caller\'s allowance.
        it('Transfer from: Root use allowance from account 1 transfer account1 -> account2 10 KFIVE', async () => {
            const i = {
                from: account1,
                to: account2,
                value: web3.utils.toHex(10 * (10 ** tokenDecimals)),
            }

            const o = {
                account1_balance: 0,
                account2_balance: 10 * (10 ** tokenDecimals),
            }

            await kfive.transferFrom(i.from, i.to, i.value, {
                from: root
            });

            let account1_balance = await kfive.balanceOf(i.from, {
                from: root
            });

            let account2_balance = await kfive.balanceOf(i.to, {
                from: root
            });

            eq(o.account1_balance, account1_balance.toString());
            eq(o.account2_balance, account2_balance.toString());
        })
    })

    describe('Pausable stage', async () => {

        it('Pause: ony owner can call it', async () => {
            await u.assertRevert(kfive.pause({
                from: account1
            }));
        })

        it('Pause: Onwer call', async () => {

            await kfive.pause({
                from: root
            });

        })

        it('Pause: 2nd Call will failed', async () => {

            await u.assertRevert(kfive.pause({
                from: root
            }));

        })

        it('Transfer: Failed when pausing', async () => {

            const i = {
                to: account1,
                value: web3.utils.toHex(10 * (10 ** tokenDecimals)),
            }

            await u.assertRevert(kfive.transfer(i.to, i.value, {
                from: account2
            }));

        })

        it('TransferFrom: Failed when pausing', async () => {
            const i = {
                from: account2,
                to: account1,
                value: web3.utils.toHex(10 * (10 ** tokenDecimals)),
            }

            await u.assertRevert(kfive.transferFrom(i.from, i.to, i.value, {
                from: root
            }));
        })

        it('Unpause: ony owner can call it', async () => {

            await u.assertRevert(kfive.unpause({
                from: account1
            }));

        })

        it('Unpause: Owner call', async () => {

            await kfive.unpause({
                from: root
            });

        })

        it('Unpause: 2nd called will be failed ', async () => {
            await u.assertRevert(kfive.unpause({
                from: root
            }));
        })

    })

    describe('Blacklist stage', async () => {

        it('Add blacklist: only owner can call it', async () => {
            const i = {
                evil: evil,
            }

            await u.assertRevert(kfive.addBlackList(i.evil, {
                from: account1
            }));
        })

        it('Add blacklist: Owner call', async () => {
            const i = {
                evil: evil,
            }

            await kfive.addBlackList(i.evil, {
                from: root
            });
        })

        it('Evil cannot call transfer + transfer from', async () => {

            const i = {
                to: evil,
                value: web3.utils.toHex(10 * (10 ** tokenDecimals)),
            }

            const o = {
                evil_balance: 10 * (10 ** tokenDecimals),
            }

            await kfive.transfer(i.to, i.value, {
                from: root
            });

            let evil_balance = await kfive.balanceOf(i.to, {
                from: evil
            });

            eq(o.evil_balance, evil_balance.toString());

            // evil try to call transfer method
            await u.assertRevert(kfive.transfer(account1, i.value, {
                from: evil
            }));

            // evil try to call transfer from method
            await kfive.approve(root, "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff", {
                from: evil
            });

            await u.assertRevert(kfive.transferFrom(evil, account1, i.value, {
                from: root
            }));

        })

        it('Remove blacklist: only owner can call it', async () => {

            const i = {
                evil: evil,
            }
            await u.assertRevert(kfive.removeBlackList(i.evil, {
                from: account1
            }));

        })

        it('Remove blacklist', async () => {

            const i = {
                evil: evil,
            }
            await kfive.removeBlackList(i.evil, {
                from: root
            });

        })

        it('evil can call transfer + transfer from method', async () => {

            const i = {
                from: evil,
                to: account2,
                value: web3.utils.toHex(5 * (10 ** tokenDecimals)),
            }

            // evil can call transfer method
            await kfive.transfer(i.to, i.value, {
                from: i.from
            });

            // evil can call transfer from method
            await kfive.transferFrom(i.from, i.to, i.value, {
                from: root
            });

            const o = {
                account2_balance: 20 * (10 ** tokenDecimals),
            }

            let account2_balance = await kfive.balanceOf(i.to, {
                from: root
            });

            eq(o.account2_balance, account2_balance.toString());

        })


        it('Cannot call destroy funds of non hacker (blacklist) wallet address', async () => {
            const i = {
                to: account6,
                value: web3.utils.toHex(10 * (10 ** tokenDecimals)),
            }

            await kfive.transfer(i.to, i.value, {
                from: root
            });

            await u.assertRevert(kfive.destroyBlackFunds(i.to, {
                from: root
            }));
        })

        it('only owner can call destroy funds of hacker', async () => {
            const i = {
                evil: account6,
            }

            await kfive.addBlackList(i.evil, {
                from: root
            });

            await u.assertRevert(kfive.destroyBlackFunds(i.evil, {
                from: account1,
            }));

            const o = {
                evil_address: account6,
                evil_balance: 0,
                evil_funds: 10 * (10 ** tokenDecimals),
            }

            let tx = await kfive.destroyBlackFunds(i.evil, {
                from: root,
            });

            let evil_balance = await kfive.balanceOf(i.evil, {
                from: i.evil
            });

            eq(o.evil_balance, evil_balance);
            eq(o.evil_address, await oc(tx, "DestroyedBlackFunds", "_blackListedUser"))
            eq(o.evil_funds, await oc(tx, "DestroyedBlackFunds", "_balance"))

        })

    })

    describe('TokenAdmin stage', async () => {

        it('Only owner can add admin', async () => {
            const i = {
                new_admin: new_admin,
                max_issuing_per_times: web3.utils.toHex(10 * (10 ** tokenDecimals)),
                max_total_issuing_token: web3.utils.toHex(10 * (10 ** tokenDecimals)),
            }

            await u.assertRevert(kfive.addAdmin(i.new_admin, i.max_issuing_per_times, i.max_total_issuing_token, {
                from: account1
            }));

        })

        it('Cannot add admin with max_total_issuing_token > cap value', async () => {

            const i = {
                new_admin: new_admin,
                max_issuing_per_times: web3.utils.toHex(10 * (10 ** tokenDecimals)),
                max_total_issuing_token: web3.utils.toHex((tokenCap + 1) * (10 ** tokenDecimals)),
            }

            await u.assertRevert(kfive.addAdmin(i.new_admin, i.max_issuing_per_times, i.max_total_issuing_token, {
                from: account1
            }));
        })

        it('Owner add admin', async () => {
            const i = {
                new_admin: new_admin,
                max_issuing_token_per_time: web3.utils.toHex(10 * (10 ** tokenDecimals)),
                max_total_issuing_token: web3.utils.toHex(100 * (10 ** tokenDecimals)),
            }

            const o = {
                status: true,
                max_issuing_token_per_time: 10 * (10 ** tokenDecimals),
                max_total_issuing_token: 100 * (10 ** tokenDecimals),
                remaining_issuing_token: 100 * (10 ** tokenDecimals),
            }

            await kfive.addAdmin(i.new_admin, i.max_issuing_token_per_time, i.max_total_issuing_token, {
                from: root
            });

            let a = await kfive.admin(i.new_admin)

            eq(o.status, a.status);
            eq(o.max_issuing_token_per_time, a.maxIssuingTokenPerTime.toString());
            eq(o.max_total_issuing_token, a.maxTotalIssuingToken.toString());
            eq(o.remaining_issuing_token, a.remainingIssuingToken.toString());
        })

        it('Only owner can remove admin', async () => {

            const i = {
                new_admin: new_admin,
            }

            await u.assertRevert(kfive.removeAdmin(i.new_admin, {
                from: account1
            }));

        })

        it('Owner remove admin', async () => {
            const i = {
                new_admin: new_admin,
            }

            await kfive.removeAdmin(i.new_admin, {
                from: root
            });

            let a = await kfive.admin(i.new_admin)

            eq(false, a.status);
        })
    })

    describe('Mint by admin stage', async () => {

        it('Issue by admin: root (also be an Admin) 10 Token to account 8 - Total supply is reached', async () => {
            i = {
                issuer: account8,
                value: web3.utils.toHex(10 * (10 ** tokenDecimals)),
            }
            await u.assertRevert(kfive.issueByAdmin(i.issuer, i.value, OFFCHAIN, {
                from: root
            }))
        })

        it('Issue by admin: account1 (Admin) 6 Token to account 8 - Maximum issuing token per time is only 5', async () => {
            let i = {
                new_admin: account1,
                max_issuing_token_per_time: web3.utils.toHex(5 * (10 ** tokenDecimals)),
                max_total_issuing_token: web3.utils.toHex(100 * (10 ** tokenDecimals)),
            }

            await kfive.addAdmin(i.new_admin, i.max_issuing_token_per_time, i.max_total_issuing_token, {
                from: root
            });

            i = {
                issuer: account8,
                value: web3.utils.toHex(6 * (10 ** tokenDecimals)),
            }
            await u.assertRevert(kfive.issueByAdmin(i.issuer, i.value, OFFCHAIN, {
                from: account1
            }))
        })

        it('Issue By Admin: account2 isn\'t an Admin', async () => {

            i = {
                issuer: account8,
                value: web3.utils.toHex(11 * (10 ** tokenDecimals)),
            }
            await u.assertRevert(kfive.issueByAdmin(i.issuer, i.value, OFFCHAIN, {
                from: account2
            }))
        })

        it('Redeem owner address for next step issue token', async () => {

            const i = {
                redeemer: root,
                value: web3.utils.toHex(10 * (10 ** tokenDecimals)),
            }

            const o = {
                total_supply: (tokenCap - 10) * (10 ** tokenDecimals),
            }

            await kfive.redeem(root, i.value, OFFCHAIN, {
                from: root
            });

            let total_supply = await kfive.totalSupply({
                from: root
            });

            eq(o.total_supply, total_supply.toString());
        })

        it('Issue by admin', async () => {
            const i = {
                issuer: account9,
                value: web3.utils.toHex(5 * (10 ** tokenDecimals)),
            }

            const o = {
                issuer_balance: 5 * (10 ** tokenDecimals),
                total_supply: (tokenCap - 5) * (10 ** tokenDecimals),
                admin_remaining_issuing: 95 * (10 ** tokenDecimals),
            }

            await kfive.issueByAdmin(i.issuer, i.value, OFFCHAIN, {
                from: account1
            });

            let a = await kfive.admin(account1)
            eq(o.admin_remaining_issuing, a.remainingIssuingToken.toString());

            let total_supply = await kfive.totalSupply({
                from: root
            });

            let issuer_balance = await kfive.balanceOf(i.issuer, {
                from: root
            });

            eq(o.total_supply, total_supply.toString());
            eq(o.issuer_balance, issuer_balance.toString());
        })

        it('Issue by admin: cannot issue total value greater than remaining issue value (100 - 5 = 95 Token)', async () => {

            const i = {
                issuer: account9,
                value: web3.utils.toHex(96 * (10 ** tokenDecimals)),
            }

            await u.assertRevert(kfive.issueByAdmin(i.issuer, i.value, OFFCHAIN, {
                from: account1
            }));
        })
    })

    describe('Transfer ownership', async () => {

        it('only owner can call transfer ownership', async () => {

            const i = {
                new_owner: new_owner,
            }

            await u.assertRevert(kfive.transferOwnership(i.new_owner, {
                from: account1
            }));

        })

        it('transfer ownership', async () => {

            const i = {
                new_owner: new_owner,
            }

            await kfive.transferOwnership(i.new_owner, {
                from: root
            });

        })

        it('root cannot call onlyOwner methods anymore', async () => {

            const i = {
                new_owner: new_owner,
                from: root,
                to: account5,
                value: web3.utils.toHex(10 * (10 ** tokenDecimals)),
            }

            await u.assertRevert(kfive.transferOwnership(i.new_owner, {
                from: root
            }));

            await u.assertRevert(kfive.transferByAdmin(i.from, i.to, i.value, OFFCHAIN, {
                from: root
            }));

            await u.assertRevert(kfive.redeem(root, i.value, OFFCHAIN, {
                from: root
            }));

            await u.assertRevert(kfive.issue(i.to, i.value, OFFCHAIN, {
                from: root
            }));

        })

    })

})