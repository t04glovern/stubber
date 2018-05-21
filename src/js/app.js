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
  cardTemplate.find('.event-price').text(parseFloat(eventPrice).toFixed(4));
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

  init() {
    loadEventsFromJson();
    return App.initWeb3();
  },

  initWeb3() {
    if (typeof web3 !== 'undefined') {
      web3 = new Web3(web3.currentProvider);
    } else {
      // set the provider you want from Web3.providers
      web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
    }
    //return App.initContract();
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
    let stubTokenInstance;

    App.contracts.StubToken.deployed().then((instance) => {
      stubTokenInstance = instance;

      return stubTokenInstance.getEvents.call();
    }).then((events) => {
      for (var i = 0; i < events.length; i++) {
        App.getEventDetails(events[i]);
      }
    }).catch((err) => {
      console.log(err.message);
    });
  },

  getEventDetails(eventId) {
    let stubTokenInstance;

    App.contracts.StubToken.deployed().then((instance) => {
      stubTokenInstance = instance;

      return stubTokenInstance.getEvent(eventId);
    }).then((event) => {
      var eventJson = {
        'id': eventId.toNumber(),
        'name': event[0],
        'location': event[1],
        'price': event[2],
        'startTime': event[3],
        'salesCurrent': event[4].toNumber(),
        'salesLimit': event[5].toNumber()
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

      App.contracts.StubToken.deployed().then((instance) => {
        stubTokenInstance = instance;

        // Execute purchase as a transaction by sending account
        return stubTokenInstance.makePurchase(eventId, {
          from: account,
          value: web3.toWei(eventPrice, 'ether'),
        });
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