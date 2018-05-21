pragma solidity 0.4.23;

import "zeppelin-solidity/contracts/token/ERC721/ERC721Token.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";

contract StubToken is ERC721Token, Ownable {

    constructor(string _name,string _symbol)
    ERC721Token(_name, _symbol) public {

    }

    struct Ticket {
        uint256 eventId;
        uint256 price;
    }

    Ticket[] public tickets;

    function getTicket(uint _ticketId) public view returns(uint256 eventId, uint256 price) {
        Ticket memory _ticket = tickets[_ticketId];

        eventId = _ticket.eventId;
        price = _ticket.price;
    }

    function mint(uint256 _event, uint256 _price) public onlyOwner {
        Ticket memory _ticket = Ticket({
            eventId: _event,
            price: _price
        });
        uint _ticketId = tickets.push(_ticket) - 1;

        _mint(msg.sender, _ticketId);
    }
}
