/** Add Event via values */
function loadEvent(
  eventId,
  eventName,
  eventPicture,
  eventLocation,
  eventPrice,
  eventStartTime,
  eventSalesCurrent,
  eventSalesLimit
) {
  const cardRow = $('#card-row');
  const cardTemplate = $('#card-template');

  cardTemplate.find('.event-name').text(eventName);
  cardTemplate.find('.card-img-top').attr('src', eventPicture);
  cardTemplate.find('.event-location').text(eventLocation);
  cardTemplate.find('.event-location').attr("href", "https://maps.google.com/?q=" + eventLocation);
  cardTemplate.find('.event-start-time').text(EpochToDate(eventStartTime));
  cardTemplate.find('.event-price').text(eventPrice.toFixed(4));
  cardTemplate.find('.btn-purchase').attr('data-id', eventId);
  cardTemplate.find('.event-sales-current').text(eventSalesCurrent);
  cardTemplate.find('.event-sales-limit').text(eventSalesLimit);

  var percentOfTarget = eventSalesCurrent / eventSalesLimit * 100;
  cardTemplate.find('.event-sales-progress').attr(
    "style", "width: " + percentOfTarget + "%; aria-valuenow: " + percentOfTarget + "%"
  );
  if (percentOfTarget >= 100) {
    cardTemplate.find('.event-sales-progress').addClass("bg-success");
  } else {
    cardTemplate.find('.event-sales-progress').removeClass("bg-success");
  }

  cardRow.append(cardTemplate.html());
}

/** Populate ticket table */
function loadTicket(ticketId, eventName, eventLocation, ticketPrice, eventTime, eventArtist) {
  const ticketTable = $('#event-tickets');
  var ticketRow = '<tr>';
  ticketRow += '<td>' + ticketId + '</td>';
  ticketRow += '<td>' + eventName + '</td>';
  ticketRow += '<td><a href="https://maps.google.com/?q=' + eventLocation + '">' + eventLocation + '</a></td>';
  ticketRow += '<td>' + EpochToDate(eventTime).toDateString().slice(0,15) + '</td>';
  ticketRow += '<td>' + ticketPrice.toFixed(4) + '</td>';
  ticketRow += '<td><a href="https://ropsten.etherscan.io/address/' + eventArtist + '">' + eventArtist.slice(0,8) + '...</a></td>';
  ticketTable.append(ticketRow);
}

/** Epoch */
function Epoch(date) {
  return Math.round(new Date(date).getTime() / 1000.0);
}

/** Epoch To Date */
function EpochToDate(epoch) {
  if (epoch < 10000000000)
      epoch *= 1000; // convert to milliseconds (Epoch is usually expressed in seconds, but Javascript uses Milliseconds)
  var epoch = epoch + (new Date().getTimezoneOffset() * -1); //for timeZone        
  return new Date(epoch);
}

/** Using the json definitions, load in sample events */
function loadEventsFromJson() {
  $.getJSON('events.json', (data) => {
    for (var i = 0; i < data.length; i++) {
      loadEvent(
        data[i].id,
        data[i].name,
        data[i].picture,
        data[i].location,
        data[i].price,
        data[i].startTime,
        data[i].salesCurrent,
        data[i].salesLimit
      );
    }
  });
}

var App = {
  contracts: {},
  StubTokenAddress: '0x045d28dc903e9f3bb8e161eea5a78c0ce0777aa3',

  init() {
    //loadEventsFromJson();
    return App.initWeb3();
  },

  initWeb3() {
    if (typeof web3 !== 'undefined') {
      web3 = new Web3(web3.currentProvider);
    } else {
      // set the provider you want from Web3.providers
      web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
    }
    return App.initContract();
  },

  initContract() {
    $.getJSON('StubToken.json', (data) => {
      // Get the necessary contract artifact file and instantiate it with truffle-contract
      const StubTokenArtifact = data;
      App.contracts.StubToken = TruffleContract(StubTokenArtifact);

      // Set the provider for our contract
      App.contracts.StubToken.setProvider(web3.currentProvider);

      // User our contract to retrieve the events that have tickets available
      return App.loadEvents();
    });
    return App.bindEvents();
  },

  loadEvents() {
    web3.eth.getAccounts(function (err, accounts) {
      if (err != null) {
        console.error("An error occurred: " + err);
      } else if (accounts.length == 0) {
        console.log("User is not logged in to MetaMask");
      } else {
        // Remove existing cards
        $('#card-row').children().remove();
      }
    });
    let stubTokenInstance = App.contracts.StubToken.at(App.StubTokenAddress);
    return totalSupply = stubTokenInstance.totalEventSupply().then((supply) => {
      for (var i = 0; i < supply; i++) {
        App.getEventDetails(i);
      }
      App.loadTickets();
    }).catch((err) => {
      console.log(err.message);
    });
  },

  loadTickets() {
    web3.eth.getAccounts(function (err, accounts) {
      if (err != null) {
        console.error("An error occurred: " + err);
      } else if (accounts.length == 0) {
        console.log("User is not logged in to MetaMask");
      } else {
        // Remove existing ticket items
        $('#event-tickets').children().remove();
      }
    });
    var address = web3.eth.defaultAccount;
    let stubTokenInstance = App.contracts.StubToken.at(App.StubTokenAddress);
    return totalSupply = stubTokenInstance.ticketsOf(address).then((tickets) => {
      for (var i = 0; i < tickets.length; i++) {
        App.addTicketDetails(tickets[i]);
      }
    }).catch((err) => {
      console.log(err.message);
    });
  },

  addTicketDetails(ticketId) {
    let stubTokenInstance = App.contracts.StubToken.at(App.StubTokenAddress);
    return stubTokenInstance.getTicketDetails(ticketId).then((ticketData) => {
      var ticketJson = {
        'id': ticketId,
        'artist': ticketData[0],
        'name': web3.toAscii(ticketData[1]).replace(/\0.*$/g,''),
        'location': web3.toAscii(ticketData[2]).replace(/\0.*$/g,''),
        'price': web3.fromWei(ticketData[3]),
        'time': ticketData[4]
      };
      loadTicket(
        ticketJson.id,
        ticketJson.name,
        ticketJson.location,
        ticketJson.price,
        ticketJson.time,
        ticketJson.artist
      );
    }).catch((err) => {
      console.log(err.message);
    });
  },

  getEventDetails(eventId) {
    let stubTokenInstance = App.contracts.StubToken.at(App.StubTokenAddress);
    return stubTokenInstance.getEvent(eventId).then((eventData) => {
      var eventJson = {
        'id': eventId,
        'artist': eventData[0],
        'name': web3.toAscii(eventData[1]).replace(/\0.*$/g,''),
        'location': web3.toAscii(eventData[2]).replace(/\0.*$/g,''),
        'price': web3.fromWei(eventData[3]),
        'startTime': eventData[4],
        'salesCurrent': eventData[5].toNumber(),
        'salesLimit': eventData[6].toNumber()
      };
      loadEvent(
        eventJson.id,
        eventJson.name,
        "img/events/" + eventJson.id + ".jpg",
        eventJson.location,
        eventJson.price,
        eventJson.startTime,
        eventJson.salesCurrent,
        eventJson.salesLimit
      );
    }).catch((err) => {
      console.log(err.message);
    });
  },

  /** Event Bindings for Form submits */
  bindEvents() {
    $(document).on('submit', 'form.event-purchase', App.handlePurchase);
    $(document).on('submit', 'form.event-create', App.handleCreateEvent);
  },

  handlePurchase(event) {
    event.preventDefault();

    // Get the form fields
    var eventId = parseInt($(event.target.elements).closest('.btn-purchase').data('id'));

    let stubTokenInstance;

    web3.eth.getAccounts((error, accounts) => {
      if (error) {
        console.log(error);
      }
      var account = accounts[0];

      let stubTokenInstance = App.contracts.StubToken.at(App.StubTokenAddress);
      stubTokenInstance.priceOf(eventId).then((price) => {
        return stubTokenInstance.purchaseTicket(eventId, {
          from: account,
          value: price
      }).then(result => App.loadEvents()).catch((err) => {
        console.log(err.message);
      });
    });
    });
  },

  handleCreateEvent(event) {
    event.preventDefault();

    // Get the form fields
    var eventName = $(event.target.elements)[0].value;
    var eventLocation = $(event.target.elements)[1].value;
    var eventPrice = parseFloat($(event.target.elements)[2].value);
    var eventStart = $(event.target.elements)[3].value;
    var eventCap = $(event.target.elements)[4].value;

    let stubTokenInstance;

    web3.eth.getAccounts((error, accounts) => {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      let stubTokenInstance = App.contracts.StubToken.at(App.StubTokenAddress);
      var ticketPrice = web3.toWei(eventPrice);

      return stubTokenInstance.createEvent(account, eventName, eventLocation, ticketPrice, eventStart, eventCap, {
        from: account,
      }).then(result => App.loadEvents()).catch((err) => {
        console.log(err.message);
      });
    });
  }
};

jQuery(document).ready(
  function ($) {
    App.init();
  }
);