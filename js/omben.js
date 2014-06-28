//Omben, or "Drink", is a 2-player card guessing game
/*
The Indonesian version of Go Fish is known as Omben in Javanese or Minuman in Indonesian, both names meaning "drink". It is said to be best for two players, each of whom begins with a hand of 4 or 5 cards (according to agreement) drawn from a 52 card pack. The players take turns to ask their opponent for a rank, such as 8 or king, and the opponent must give the asker all cards of that rank that he or she holds. If the opponent has no such card the asker must "drink" by drawing cards from the pile of undealt cards: the asker continues to draw until he or she finds a card of the rank that was asked for. Whenever a player has four of a kind in hand, it must be discarded face up. The winner is the first player to get rid of all their cards - it does not matter how many or few sets they have made. If the stock runs out, the player with fewer cards is the winner. Note that in this game the players ask alternately, irrespective of whether the card asked for is found in the other player's hand or the draw pile.
*/

var debugMode = true;
var handSize = 5;

//==================================================
// Game Class
//==================================================

function Game () {
	this.round = 1;
	this.deck;
	this.player1;
	this.player2;
	this.currentPlayer;
	this.otherPlayer;
}

Game.prototype = {
	init: function(player1NameVar,player2NameVar,autoPlay) {

		this.deck = new Deck();
		this.deck.init();

		this.player1 = new Player(this.deck, player1NameVar);
		this.player2 = new Player(this.deck, player2NameVar);

		this.player1.init();
		this.player2.init();

		this.currentPlayer = this.player1;
		this.otherPlayer = this.player2;

		this.cardRankNeeded = 0; //had to make this "global" to work with the deck button

		this.UI = new UI();
		this.UI.init(this.deck,this.player1,this.player2);

		this.round = 0;

		if (debugMode) {
			console.log(" *debug: Deck contents: " + this.deck.printCardsIn(this.deck.cards,false));
			console.log(" *debug: Draw pile contents: " + this.deck.printCardsIn(this.deck.cards,false));

			console.log("Player 1 is: " + this.player1.name + "\n"+
			this.player1.name + "'s hand contains: " + this.deck.printCardsIn(this.player1.handCards,true) +
			"\n\nPlayer 2 is: " + this.player2.name + "\n"+
			this.player2.name + "'s hand contains: " + this.deck.printCardsIn(this.player2.handCards,true) +
			"\n\nPlayer 1 goes first.\nROUND 1");
		}

		this.UI.showPlaymat();
		this.UI.updatePlaymat();
		gameMessage("Starting game");

			if (autoPlay == true) {
				this.autoPlayLoop();
			} else {
				this.playerTurnHuman();
			}

		$("#deckButtonDiv").on("click","#deckButton",function() {game.currentPlayer.drawFromDeck();});
	},

	calculateAndPrintWinner: function () {

		console.log(this.player1.name + "'s hand history: " + this.player1.printHistory());
		console.log(this.player2.name + "'s hand history: " + this.player2.printHistory());

		var gameOverStr = "";
			if (this.deck.cards.length === 0) { //game ended because deck ran out
				gameOverStr += "Deck ran out! \n";
				if (this.player1.handCards.length < this.player2.handCards.length) {
					gameOverStr += this.player1.name + " WINS!";
				} else if (this.player2.handCards.length < this.player1.handCards.length) {
					gameOverStr += this.player2.name + " WINS!";
				} else if (this.player1.handCards.length == this.player2.handCards.length) {
					gameOverStr += "TIE! Everyone is a winner!";
				}
			//game ended because a player reached 0 cards
		} else if (this.player1.handCards.length === 0) {
				gameOverStr += this.player1.name + " WINS!";
			} else if (this.player2.handCards.length === 0) {
				gameOverStr += this.player2.name + " WINS!";
			}

		gameMessage(gameOverStr + "\n" +
			"Deck cards remaining: " + this.deck.cards.length + "\n" +
			this.player1.name + " card total: " + this.player1.handCards.length + "\n" +
			this.player2.name + " card total: " + this.player2.handCards.length);
	},

	playerTurnAutoPlay: function () {
		var randomCard = this.currentPlayer.chooseRandomCardFromPlayerHand();
		this.currentPlayer.sayAskForCard(randomCard);

		var cardsFound = this.otherPlayer.giveMatchingCards(randomCard.rank);

		if (cardsFound.length > 0) { //take from opponent
			this.currentPlayer.takeCards(cardsFound,this.otherPlayer);
		} else { //draw from deck
			this.otherPlayer.opponentSaysDrink(randomCard);
			this.currentPlayer.drinkManual(randomCard.rank);
		}
	},

	endTurnSwapPlayers: function() {
		if (this.player1.handCards.length > 0 && this.player2.handCards.length > 0 && this.deck.cards.length > 0) {
			if (this.currentPlayer == this.player2) { //player 2's turn just ended
				this.round++;
				this.currentPlayer.updateHistory(false, this.round);
				this.otherPlayer.updateHistory(false, this.round);

				this.currentPlayer = this.player1;
				this.otherPlayer = this.player2;

				gameMessage("<b>ROUND " + this.round + "</b>");
				this.playerTurnHuman();	
			} else { //player 1's turn just ended
				this.currentPlayer = this.player2;
				this.otherPlayer = this.player1;

				this.UI.updateRoundText(this.round,this.currentPlayer.name);
				this.UI.swapPlayerUI("player2","player1");
				this.playerTurnAI();
			}
		} else { //game is won
			this.currentPlayer.updateHistory(true, 0);
			this.otherPlayer.updateHistory(true, 0);
			this.calculateAndPrintWinner(this.deck,this.player1,this.player2);
		}
	},

	playerTurnAI: function() {
		gameMessage(this.currentPlayer.name + "'s turn.");
		$("#instructions").html(this.currentPlayer.name + " is choosing a card...");

		var chosenCard = this.currentPlayer.chooseRandomCardFromPlayerHand();
		this.currentPlayer.sayAskForCard(chosenCard);
		var cardsFound = this.otherPlayer.giveMatchingCards(chosenCard.rank);
		alert(this.currentPlayer.name + "'s turn. " + this.currentPlayer.name + ' asks, "Do you have any ' + chosenCard.displayRank() + "'s ?");

		if (cardsFound.length > 0) { 
			//take all matches from opponent
			this.currentPlayer.takeCards(cardsFound,this.otherPlayer);
			alert("You give " + this.currentPlayer.name + " " + cardsFound.length + " card(s) of rank " + chosenCard.rank + " from your hand.");
			this.UI.updatePlaymat();
		} else { 
			//no matching cards found, draw from deck
			this.otherPlayer.opponentSaysDrink(chosenCard);
			this.currentPlayer.drinkAuto(chosenCard.rank);
		}
		this.endTurnSwapPlayers();
	},

	playerTurnHuman: function() {
		this.UI.updateRoundText(this.round,this.currentPlayer.name);
		gameMessage(this.currentPlayer.name + "'s turn. Click a card in your hand.");
		this.UI.updateInstructions();
		this.UI.swapPlayerUI("player1","player2");

		alert("YOUR TURN! Click on a card in your hand to select it.");
	},

	playerChooseThisCardFromHand: function(chosenCardID) {
		chosenCard = Card.list[chosenCardID];
		gameMessage(this.currentPlayer.name + " selected this card: " + chosenCard.displayCard());
		this.currentPlayer.sayAskForCard(chosenCard);

		var cardsFound = this.otherPlayer.giveMatchingCards(chosenCard.rank);
		if (cardsFound.length > 0) { 
			//take from opponent
			this.currentPlayer.takeCards(cardsFound,this.otherPlayer);
			alert(this.otherPlayer.name + " has " + cardsFound.length + " cards of rank " + chosenCard.rank + "! You take " + cardsFound.length + " cards from " + this.otherPlayer.name + "'s hand.");
			this.endTurnSwapPlayers(); // turn ends, swap players
		} else { //draw from deck
			this.otherPlayer.opponentSaysDrink(chosenCard);
			this.cardRankNeeded = chosenCard.rank;
			this.UI.enableDeckButton();
			//wait for player to click the draw button
		}
	},

	autoPlayLoop: function() {
		while (this.player1.handCards.length > 0 && this.player2.handCards.length > 0 && this.deck.cards.length > 0) {
			this.playerTurnAutoPlay(this.currentPlayer,this.otherPlayer);
			if (this.currentPlayer == this.player1) {
				this.currentPlayer = this.player2;
				this.otherPlayer = this.player1;
			} else {
				this.round++;
				this.currentPlayer.updateHistory(false, this.round);
				this.otherPlayer.updateHistory(false, this.round);
				console.log("ROUND " + this.round);
				this.currentPlayer = this.player1;
				this.otherPlayer = this.player2;
			}
			gameMessage(this.currentPlayer.name + "'s turn!");
		}
		this.currentPlayer.updateHistory(true, 0);
		this.otherPlayer.updateHistory(true, 0);
		this.calculateAndPrintWinner(this.deck,this.player1,this.player2);
	},
};

//==================================================
// Deck Class
//==================================================

function Deck () {
	this.cards = [];
}

Deck.prototype = {
	init: function() {
		for (i = 1; i <= Card.validRanks; i++) {
			for (j = 0; j < Card.validSuits.length; j++) {
				var gameCard = new Card(Card.validSuits[j],i);
				this.cards.push(gameCard);
			}
		}
		this.shuffleDeck(this.cards);
	},

	shuffleDeck: function(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
	return array;
	},

	printCardsIn: function(array, isPretty) {
		var deckStr = "\n";
		for (i = 0; i < array.length; i ++) {
			if (isPretty == false) { //print debug
				deckStr += "Index " + i + " contains: " + array[i].displayCard() + "\n";
			} else {
				deckStr += "[" + array[i].displayCard() + "] ";
			}
		}
		return deckStr;
	},
}

// ==================================================
// UI Display Class
// ==================================================

function UI () {
	this.deck;
	this.player1;
	this.player2;
}

UI.prototype = {
	init: function(deck,player1,player2) {

		this.deck = deck;
		this.player1 = player1;
		this.player2 = player2;

		for (i = 0; i < Card.list.length; i++) {
			var cardName = Card.list[i].displayCard();
			$("#p1Cards").append("<button class='p1card' id='card" + i +"' value='" + i + "'>"+cardName+"</button>");
				$("#p1Cards").on("click","#card"+i,function() { 
					game.playerChooseThisCardFromHand($(this).attr("value"));
				});
			$("#p2Cards").append("<button class='p2card' id='opponentCard"+i+"'>?</button>");
		}
	},

	showPlaymat: function () {
		$("#setupForm").hide();
    	$("#playMat").fadeIn("slow");
    	$("#logSection").fadeIn("slow");
    	this.disableDeckButton();
	},

	updatePlaymat: function() {
		gameMessage("Deck length: " + this.deck.cards.length);
		$("#deckButton").html("?");
		$("#deckButtonLabel").html("<b>Total: " + this.deck.cards.length +"</b>");
		this.updateCardsOnPlaymat(this.player1,"#card");
		this.updateCardsOnPlaymat(this.player2,"#opponentCard");
	},

	updateCardsOnPlaymat: function(currentPlayer,cardIDString) {
		idString = cardIDString;
		//hide all the cards
		for (i = 0; i < Card.list.length; i ++) {
			$(idString + i).hide();
		}
		//show cards by ID based on what's in player hand
		for (j = 0; j < currentPlayer.handCards.length; j++) {
			id = currentPlayer.handCards[j].cardID;
			$(idString + id).show();
		}
	},

	swapPlayerUI: function(activePlayer,inactivePlayer) {
		$("#" + activePlayer +"Mat").css("background-color","green").css("border","5px solid #00FF7F");
		$("#" + inactivePlayer + "Mat").css("background-color","#BBB").css("border","5px solid grey");
	},

	updateInstructions: function() {
		$("#instructions").empty();
		$("#instructions").append("Choose a card from your hand. Your opponent will give you any (and all) cards he/she has that match the chosen card's rank. If your opponent does not have any cards that match the rank, you'll draw from the deck until you get one that does.");
	},

	updateRoundText: function(round,currentPlayer) {
		$("#currentTurnAndRound").html("<b>ROUND " + round + "</b></br>Current Player: " + currentPlayer.name);
	},

	enableDeckButton: function() {
		$("#deckButton").removeAttr("disabled").css("background-color", "lime");
		$("#deckButton:hover").css("background-color", "lime"); //todo: figure out why it doesnt work
	},

	disableDeckButton: function() {
		$("#deckButton").attr("disabled","disabled").css("background-color", "#333");
		$("#deckButton:hover").css("background-color", "gray");
	},

	//not hooked up yet 
	enablePlayerHandButtons: function() {
		$("#deckButton").attr("disabled","disabled").css("background-color", "gray");
		$("#deckButton:hover").css("background-color", "gray");
	},

	disablePlayerHandButtons: function() {
		$("#deckButton").attr("disabled","disabled").css("background-color", "gray");
		$("#deckButton:hover").css("background-color", "gray");
	},
}



//==================================================
// Card Class
//==================================================

function Card (suit,rank) {
	this.suit = suit;
	this.rank = rank;

	if (!Card.list) { Card.list = []; }
	this.cardID = Card.list.length || 0;
	Card.list.push(this);
}

	Card.validSuits = ["♥", "♠", "♣", "♦"];
	Card.validRanks = 13;
	

Card.prototype = {
	displayCard: function() {
		var cardStr = "";
		cardStr += this.displayRank();
		return cardStr + " " + this.suit;
	},

	displayRank: function() {
		var rankStr = "";
		switch (this.rank) {
			case 1:
				rankStr = "A";
				break;
			case 11:
				rankStr = "J";
				break;
			case 12:
				rankStr = "Q";
				break;
			case 13:
				rankStr = "K";
				break;
			default:
				rankStr = this.rank;
		}
		return rankStr;
	},

}

//==================================================
// Player Class
//==================================================

function Player (deck, name) {
	this.handCards = [];
	this.deck = deck;
	this.name = name;
	this.history = [];
}


Player.prototype = {
	constructor: Player,

	init: function() {
		for (var i = 0; i < handSize; i ++ ) {
			this.handCards[i] = this.deck.cards.shift();
		}
		this.history.push("\nStarting card total: " + i);
		this.sayMyHandContents();
	},

	sayMyHandContents: function() {
		if (debugMode) {
			console.log(" *debug: " + this.name + "'s hand now contains: " + this.deck.printCardsIn(this.handCards,false));
		}
	},

	sayAskForCard: function(currentCard) {
		var askStr = this.name + ' asks, "Do you have any ' + currentCard.displayRank();
			if (currentCard.rank >= 10 || currentCard.rank == 1) {
				askStr += "s?";
			} else { //it's a number, use apostrophe
				askStr += "'s?";
			}
		gameMessage(askStr);
	},

	opponentSaysDrink: function(card) {
		var replyStr = this.name + ' replies, "Nope, no '+ card.displayRank() + "'s in my hand. DRINK!";
		gameMessage(replyStr);
		alert(replyStr);
	},

	updateHistory: function(isGameOver, round) {
		var textStr = "";
		if (isGameOver) {
			textStr = "\n Game end card total: ";
		} else {
			textStr = "\n Round " + round + " card total:";
		}
		this.history.push(textStr + this.handCards.length);
	},

	printHistory: function() {
		var historyStr = "";
		for (i = 0; i < this.history.length; i++) {
			historyStr += this.history[i] + " ";
		}
		return historyStr;
	},

	chooseRandomCardFromPlayerHand: function() {
		var currentCard = this.handCards[Math.floor(Math.random()*this.handCards.length)];
		return currentCard;
	},

	giveMatchingCards: function(rank) {
		var matchingOpponentCards = [];
		for (i = 0; i < this.handCards.length; i ++) {
			if (rank == this.handCards[i].rank) {
				if (debugMode) { console.log(" *debug: this.handCards[i]" + this.handCards[i].displayCard()); }
				matchingOpponentCards.push(this.handCards.splice(i,1)[0]);
			}
		}
		return matchingOpponentCards; //pass back an array full of matching cards
	},

	findSetOfFour: function (card) {
		//gameMessage("  Checking for a set of four " + card.displayRank(card.rank) + "s in " + this.name + "'s hand containing " + this.handCards.length + " cards...");
		var matchIndices = [];

		for (i = 0; i < this.handCards.length; i ++) {
			if (card.rank == this.handCards[i].rank) {
				matchIndices.push(i);
				if (debugMode) {
					gameMessage("    Match found! " + card.displayRank(card.rank) + " matches " + this.handCards[i].displayCard() + ". Total matches so far: " + matchIndices.length);
				}
			} else {
				if (debugMode) {
					gameMessage("    Not a match. " + card.displayRank(card.rank) + " does not match " + this.handCards[i].displayCard());
				}
			}
		}

		if (matchIndices.length == 4) {
			var theseCardsStr = "";
			for (i = 0; i < matchIndices.length; i++) {
				var removeIndex = matchIndices[i];
				theseCardsStr += "[" + this.handCards[removeIndex - i].displayCard() + "] ";
				this.handCards.splice(removeIndex - i,1);
			}

			//todo refactor game message to have an optional alert bool 
			gameMessage("    Completed a set of 4! Removed these cards: " + theseCardsStr + " from " + this.name + "'s hand.");
			alert("Completed a set of 4! Removed these cards: " + theseCardsStr + " from " + this.name + "'s hand.");

			game.UI.updatePlaymat();
			matchesFound = 0;
			matchIndices = [];
		} else {
			gameMessage("  Did not find a set of four " + card.displayRank(card.rank) + "'s in " + this.name + "'s hand.");
		}
	},

	takeCards: function(cards,otherPlayer) {
		//create the console.log string
		var matchedCardsStr = "";
		for (var i = 0; i < cards.length; i ++ ) {
			matchedCardsStr += " [" + cards[i].displayCard() + "]";
		}
		gameMessage(otherPlayer.name + ' replies, "Yes, take my:' + matchedCardsStr + '."');
	 	gameMessage(this.name + " acquires " + matchedCardsStr + " and checks own hand to see if a set is made...");

	 	//push from cards array to player hand and check for sets of four
	 	for (var i = 0; i < cards.length; i ++) {
			this.handCards.push(cards[i]);
			this.findSetOfFour(cards[i]);
		}
		this.sayMyHandContents();

	},

	drinkAuto: function(rank) {
		if (this.deck.cards.length > 0) {
			gameMessage(this.name + " drinks...");

			for (i = 0; i < this.deck.cards.length; i ++) {
				//draw a card from the face down deck and see if it makes a set of 4
				var drewCard = this.deck.cards[0];
				this.handCards.push(this.deck.cards.shift());
				gameMessage(this.name + " drew this card from the pile: [" + drewCard.displayCard() + "]");

				if (rank == drewCard.rank) {
					gameMessage(this.name + " stops drawing cards. " + drewCard.displayCard() + "'s rank matches " + this.name + "'s " + rank + ".");
				}

				this.findSetOfFour(drewCard);

				if (rank == drewCard.rank) { ///if it matches the rank you're looking for, stop drawing
					break;
				}
			}
		} else {
			gameMessage("No cards to drink from! GAME OVER!");
		}
	},

	drawFromDeck: function() {
		if (this.deck.cards.length > 0) {
			event.stopPropagation();
			gameMessage(this.name + " drinks...");
			drewCard = this.deck.cards[0];
			this.handCards.push(this.deck.cards.shift());
			game.UI.updatePlaymat();

			var drewCardStr = "You drew a [" + drewCard.displayCard() + "] and added it to your hand!";
			if (drewCard.rank == game.cardRankNeeded) { 
				drewCardStr += " You found a card that matches " + game.cardRankNeeded + "! STOP DRAWING";
				alert(drewCardStr);
				this.findSetOfFour(drewCard); //does this card finish a set of four? let's check...
				game.UI.disableDeckButton();
				game.endTurnSwapPlayers();
			} else {
				drewCardStr += " Rank mismatch! You need a " + game.cardRankNeeded + " but you drew a " + drewCard.displayRank() + ". Click deck to draw again!";
				alert(drewCardStr);
				this.findSetOfFour(drewCard); //does this card finish a set of four? let's check...
			}
			
		}
	},
}

//==================================================
// Start the game
//==================================================


function startGame (form, autoPlay) {
    var player1NameVar = form.name1.value;
    var player2NameVar = form.name2.value;
    game = new Game();
	game.init(player1NameVar,player2NameVar,autoPlay);

	//todo: investigate why pushing the name var via jquery breaks css padding(?) or line height (?) or margin (?)
	//$("#opponentHandTitle").html("<p>" + player2NameVar + "'s Hand</p>");
}

function gameMessage(msg) {
	$("#gameplayLog").prepend("<li>" + msg + "</li>").fadeIn("slow");
	console.log(msg);
}

$( document ).ready(function() {
	$("#playMat").hide();
	$("#logSection").hide();

	//parallax technique from http://code.tutsplus.com/tutorials/a-simple-parallax-scrolling-technique--net-27641
	$('section[data-type="background"]').each(function(){
      var $bgobj = $(this); // assigning the object
		
		$(window).scroll(function() {
            var yPos = -($window.scrollTop() / $bgobj.data('speed')); 
             
            // Put together our final background position
            var coords = '50% '+ yPos + 'px';
 
            // Move the background
            $bgobj.css({ backgroundPosition: coords });
        }); 
    });    
});



//Resources used
//Fisher Yates randomizer found: http://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
