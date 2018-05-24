pragma solidity 0.4.23;

import "zeppelin-solidity/contracts/token/ERC721/ERC721Token.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";

contract StubToken is ERC721Token, Ownable {

    constructor(string _name,string _symbol)
    ERC721Token(_name, _symbol) public {

    }

    event NewEvent(uint _eventId);

    struct Ticket {
        uint eventId;
        uint price;
    }

    struct Event {
        address artist;
        bytes32 name;
        bytes32 location;
        uint price;
        uint time;
        uint salesCap;
    }

    Ticket[] public tickets;
    Event[] public events;

    mapping (uint => uint) private totalEventSales;
    mapping (address => uint) private totalOwnedTickets;
    mapping (uint => uint) private eventRevenue;

    modifier onlyArtist(uint _eventId) {
        Event memory _event = events[_eventId];
        require(msg.sender == _event.artist);
        _;
    }

    /// @dev Returns the general ticket details for a given ticket ID
    /// @param _ticketId ID of the ticket (ERC721 token)
    function getTicket(uint _ticketId) public view returns(uint eventId, uint price) {
        Ticket memory _ticket = tickets[_ticketId];
        eventId = _ticket.eventId;
        price = _ticket.price;
    }

    /// @dev Returns the event for a given event ID
    /// @param _eventId ID of the event
    function getEvent(uint _eventId) public view returns(
            address artist, 
            bytes32 name, 
            bytes32 location, 
            uint price, 
            uint time, 
            uint sales, 
            uint salesCap
        ) {
        Event memory _event = events[_eventId];

        artist = _event.artist;
        name = _event.name;
        location = _event.location;
        price = _event.price;
        time = _event.time;
        sales = totalEventSales[_eventId];
        salesCap = _event.salesCap;
    }

    function getTicketDetails(uint _ticketId) public view returns(
            address artist, 
            bytes32 name, 
            bytes32 location, 
            uint price, 
            uint time
        ) {
        Ticket memory _ticket = tickets[_ticketId];
        Event memory _event = events[_ticket.eventId];

        artist = _event.artist;
        name = _event.name;
        location = _event.location;
        price = _event.price;
        time = _event.time;
    }

    /// @dev Used to create a new Event
    /// @param _artist Address of the artist to recieve the funds
    /// @param _name Name of the event (32 Character limit)
    /// @param _location Name of the location for the event (32 Character limit)
    /// @param _price Ticket price for the event
    /// @param _time Timestamp in Epoch for the event
    /// @param _salesCap Number of tickets allowed to be sold for the event
    function createEvent(address _artist, bytes32 _name, bytes32 _location, uint _price, uint _time, uint _salesCap) public onlyOwner {
        Event memory _event = Event({
            artist: _artist,
            name: _name,
            location: _location,
            price: _price,
            time: _time,
            salesCap: _salesCap
        });
        uint _eventId = events.push(_event) - 1;
        emit NewEvent(_eventId);
    }

    /// @dev Used to purchase a ticket for a given event
    /// @param _eventId ID of the event
    function purchaseTicket(uint _eventId) public payable {
        Event memory _event = events[_eventId];
        uint sellingPrice = _event.price;

        require(_event.salesCap > totalEventSales[_eventId]);
        require(msg.value >= sellingPrice);

        Ticket memory _ticket = Ticket({
            eventId: _eventId,
            price: sellingPrice
        });

        uint _ticketId = tickets.push(_ticket) - 1;
        _mint(msg.sender, _ticketId);
        totalEventSales[_eventId]++;
        totalOwnedTickets[msg.sender]++;

        uint excess = msg.value.sub(sellingPrice);
        eventRevenue[_eventId] += sellingPrice;
        if (excess > 0) {
            msg.sender.transfer(excess);
        }
    }

    /// @dev Used to get the price of a given ticket
    /// @param _eventId ID of the event
    function priceOf(uint _eventId) public view returns (uint _price) {
        Event memory _event = events[_eventId];
        return _event.price;
    }

    /// @dev Get the ID's of the tickets owned by someone
    /// @param _owner Address of someone
    function ticketsOf(address _owner) public view returns(uint[]) {
        uint tokenCount = totalOwnedTickets[_owner];
        if (tokenCount == 0) {
            return new uint[](0);
        } else {
            uint[] memory result = new uint[](tokenCount);
            uint resultIndex = 0;

            for (uint i = 0; i < tokenCount; i++) {
                result[resultIndex] = tokenOfOwnerByIndex(_owner, i);
                resultIndex++;
            }
            return result;
        }
    }

    /// @dev Gets the total number of events for enumeration purposes
    function totalEventSupply() public view returns (uint256 _totalSupply) {
        _totalSupply = events.length;
    }

    /// @dev Returns the balance value for an event
    function withdrawBalance(uint _eventId) public onlyArtist(_eventId) {
        Event memory _event = events[_eventId];
        uint amount = eventRevenue[_eventId];
        address to = _event.artist;

        require(amount <= address(this).balance);
        eventRevenue[_eventId] = 0; // Empty event revenue

        if (to == address(0)) {
            owner.transfer(amount); // funds are put into owners wallet IF event was created wrong
        } else {
            to.transfer(amount);
        }
    }
}
