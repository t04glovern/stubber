import assertRevert from "zeppelin-solidity/test/helpers/assertRevert";
import ether from "zeppelin-solidity/test/helpers/ether";

const StubToken = artifacts.require("StubToken");

contract("Stub token", accounts => {
  it("Should make first account an owner", async () => {
    let instance = await StubToken.deployed();
    let owner = await instance.owner();
    assert.equal(owner, accounts[0]);
  });

  describe("mint", () => {
    it("creates event and a ticket on that event", async () => {
      let instance = await StubToken.deployed();
      let owner = await instance.owner();

      let events = await instance.createEvent(
        web3.fromAscii('Test'),
        web3.fromAscii('Perth'),
        ether(0.18850604858538503),
        1531222200
      )
      let eventid = events.logs[0].args._eventId;
      let token = await instance.mint(eventid, ether(0.18850604858538503));

      let tokens = await instance.tokenOfOwnerByIndex(owner, 0);
      let ticket = await instance.getTicket(tokens);
      assert.deepEqual(ticket, [eventid, ether(0.18850604858538503)]);
    });

    it("allows to mint only to owner", async () => {
      let instance = await StubToken.deployed();
      let other = accounts[1];

      await instance.transferOwnership(other);
      await assertRevert(instance.mint(ether(1), ether(1)));
    });
  });
});
