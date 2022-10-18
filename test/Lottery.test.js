const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider())

const {interface, bytecode} = require('../compile')

let lottery;
let accounts;

beforeEach(async () => {
    accounts = await web3.eth.getAccounts()
    lottery = await new web3.eth.Contract(JSON.parse(interface))
    .deploy({ data: bytecode })
    .send({ from: accounts[0], gas: '1000000' })
})

describe("Lottery Contract", () => {
    it('Is Deployed', () => {
        assert.ok(lottery.options.address);
    })
    it("allows 1 account to enter", async () => {
        await lottery.methods.enter().send({ from: accounts[0], value: web3.utils.toWei('0.02', 'ether') })
        const players = await lottery.methods.getPlayers().call({from: accounts[0]})
        assert.equal(players[0], accounts[0])
        assert.equal(1, players.length)
    })
    it("allows multiple account to enter", async () => {
        await lottery.methods.enter().send({ from: accounts[0], value: web3.utils.toWei('0.02', 'ether') })
        await lottery.methods.enter().send({ from: accounts[1], value: web3.utils.toWei('0.03', 'ether') })
        await lottery.methods.enter().send({ from: accounts[2], value: web3.utils.toWei('0.04', 'ether') })

        const players = await lottery.methods.getPlayers().call({from: accounts[0]})
        assert.equal(players[0] , accounts[0])
        assert.equal(players[1] , accounts[1])
        assert.equal(players[2] , accounts[2])
        assert.equal(3, players.length)
    })
    it("Requires minimum ether", async () => {
        try {
            await lottery.methods.enter().send({from: accounts[0], value: 0})
            assert(false)
        } catch (err) {
            assert.ok(err)
        }
    })
    it('Only manager can pick winner', async () => {
        try {
            await lottery.methods.pickWinner().send({ from: accounts[1] })
            assert(false)
        }
        catch(err) {
            assert.ok(err)
        }
    })
    it('Sends money to the winner and resets the players array', async () => {
        await lottery.methods.enter().send({from: accounts[0], value: web3.utils.toWei('1', 'ether')});
        const initalBalance = await web3.eth.getBalance(accounts[0])
        await lottery.methods.pickWinner().send({ from: accounts[0] })
        const finalBalance = await web3.eth.getBalance(accounts[0])
        const difference = finalBalance - initalBalance;
        assert(difference > web3.utils.toWei('0.8', 'ether'))
    })
})