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
  cardTemplate.find('.event-price').text(eventPrice.toFixed(4));
  cardTemplate.find('.btn-purchase').attr('id', eventId);
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
  StubTokenAddress: '0x345ca3e014aaf5dca488057592ee47305d9b3e10',

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
    }).catch((err) => {
      console.log(err.message);
    });
  },

  getEventDetails(eventId) {
    let stubTokenInstance = App.contracts.StubToken.at(App.StubTokenAddress);
    return stubTokenInstance.getEvent(eventId).then((eventData) => {
      var eventJson = {
        'id': eventId,
        'name': web3.toAscii(eventData[0]),
        'location': web3.toAscii(eventData[1]),
        'price': web3.fromWei(eventData[2]),
        'startTime': eventData[3],
        'salesCurrent': eventData[4].toNumber(),
        'salesLimit': eventData[5].toNumber()
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
    var eventPrice = parseFloat($(event.target.elements)[0].value);

    let stubTokenInstance;

    web3.eth.getAccounts((error, accounts) => {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      let stubTokenInstance = App.contracts.StubToken.at(App.StubTokenAddress);
      return stubTokenInstance.makePurchase(eventId, {
        from: account,
        value: web3.toWei(eventPrice, 'ether'),
      }).then(result => App.loadEvents()).catch((err) => {
        console.log(err.message);
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

      return stubTokenInstance.createEvent(eventName, eventLocation, ticketPrice, eventStart, eventCap, {
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