//Omben, or "Drink", is a 2-player card guessing game
/*
The Indonesian version of Go Fish is known as Omben in Javanese or Minuman in Indonesian, both names meaning "drink". It is said to be best for two players, each of whom begins with a hand of 4 or 5 cards (according to agreement) drawn from a 52 card pack. The players take turns to ask their opponent for a rank, such as 8 or king, and the opponent must give the asker all cards of that rank that he or she holds. If the opponent has no such card the asker must "drink" by drawing cards from the pile of undealt cards: the asker continues to draw until he or she finds a card of the rank that was asked for. Whenever a player has four of a kind in hand, it must be discarded face up. The winner is the first player to get rid of all their cards - it does not matter how many or few sets they have made. If the stock runs out, the player with fewer cards is the winner. Note that in this game the players ask alternately, irrespective of whether the card asked for is found in the other player's hand or the draw pile.
*/

var debugMode = false;
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
	this.autoPlay;
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

		this.round = 1;
		this.autoPlay = autoPlay;

		consoleLogMessage("debug", " *debug: Deck contents: " + this.deck.printCardsIn(this.deck.cards,false));
		consoleLogMessage("debug", " *debug: Draw pile contents: " + this.deck.printCardsIn(this.deck.cards,false));
		consoleLogMessage("debug", "Player 1 is: " + this.player1.name + "\n"+
			this.player1.name + "'s hand contains: " + this.deck.printCardsIn(this.player1.handCards,true) +
			"\n\nPlayer 2 is: " + this.player2.name + "\n"+
			this.player2.name + "'s hand contains: " + this.deck.printCardsIn(this.player2.handCards,true) +
			"\n\nPlayer 1 goes first.\nROUND 1");

		this.UI.showPlaymat();
		this.UI.updatePlaymat();

		gameplayLogMessage("Starting game");

			if (this.autoPlay === true) {
				this.autoPlayLoop();
			} else {
				this.playerTurnHuman();
			}

		$("#deckButtonDiv").on("click","#deckButton",function() {game.currentPlayer.drawFromDeck();});
	},

	calculateAndPrintWinner: function () {
		console.log("made it to print winner");
		var historyStr = this.player1.name + "'s hand history: " + this.player1.printHistory();
		historyStr += this.player2.name + "'s hand history: " + this.player2.printHistory();
		consoleLogMessage("always",historyStr);

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

		gameOverStr += "\n" +
			"Deck cards remaining: " + this.deck.cards.length + "\n" +
			this.player1.name + " card total: " + this.player1.handCards.length + "\n" +
			this.player2.name + " card total: " + this.player2.handCards.length;
		gameplayLogMessage(gameOverStr);
		alert(gameOverStr);
	},

	playerTurnAutoPlay: function () {
		var randomCard = this.currentPlayer.chooseRandomCardFromPlayerHand();
		this.currentPlayer.sayAskForCard(randomCard);

		var cardsFound = this.otherPlayer.giveMatchingCards(randomCard.rank);
		if (cardsFound.length > 0) { //take from opponent
			this.currentPlayer.takeCards(cardsFound,this.otherPlayer);
		} else { //draw from deck
			this.otherPlayer.opponentSaysDrink(randomCard);
			this.currentPlayer.drinkAuto(randomCard.rank);
		}
	},

	swapCurrentAndOtherPlayerAssignments: function(newCurrentPlayer,newOtherPlayer) {
		this.currentPlayer = newCurrentPlayer;
		this.otherPlayer = newOtherPlayer;
	},

	endTurnSwapPlayers: function() {
		if (this.player1.handCards.length > 0 && this.player2.handCards.length > 0 && this.deck.cards.length > 0) {
			if (this.currentPlayer == this.player2) { //player 2's turn just ended
				this.round++;
				this.updatePlayerHistoryLogs(false,this.round);
				this.swapCurrentAndOtherPlayerAssignments(this.player1,this.player2);

				gameplayLogMessage("<b>ROUND " + this.round + "</b>");
				this.playerTurnHuman();
			} else { //player 1's turn just ended
				this.swapCurrentAndOtherPlayerAssignments(this.player2,this.player1);

				this.UI.updateRoundText(this.round,this.currentPlayer);
				this.UI.swapPlayerUI("player2","player1");
				this.playerTurnAI();
			}
		} else { //game is won
			updatePlayerHistoryLogs(true,0);
			this.calculateAndPrintWinner(this.deck,this.player1,this.player2);
		}
	},

	playerTurnAI: function() {
		gameplayLogMessage(this.currentPlayer.name + "'s turn.");
		$("#instructions").html(this.currentPlayer.name + " is choosing a card...");

		var chosenCard = this.currentPlayer.chooseRandomCardFromPlayerHand();
		this.currentPlayer.sayAskForCard(chosenCard);
		var cardsFound = this.otherPlayer.giveMatchingCards(chosenCard.rank);
		gameplayAlertMessage(this.currentPlayer.name + "'s turn. " + this.currentPlayer.name + ' asks, "Do you have any ' + chosenCard.displayRank() + "'s ?");

		if (cardsFound.length > 0) { 
			//take all matches from opponent
			this.currentPlayer.takeCards(cardsFound,this.otherPlayer);
			gameplayAlertMessage("You give " + this.currentPlayer.name + " " + cardsFound.length + " card(s) of rank " + chosenCard.rank + " from your hand.");
			this.UI.updatePlaymat();
		} else { 
			//no matching cards found, draw from deck
			this.otherPlayer.opponentSaysDrink(chosenCard);
			this.currentPlayer.drinkAuto(chosenCard.rank);
		}
		this.endTurnSwapPlayers();
	},

	playerTurnHuman: function() {
		this.UI.updateRoundText(this.round,this.currentPlayer);
		gameplayLogMessage(this.currentPlayer.name + "'s turn. Click a card in your hand.");
		this.UI.updateInstructions();
		this.UI.swapPlayerUI("player1","player2");

		gameplayAlertMessage("YOUR TURN! Click on a card in your hand to select it.");
	},

	updatePlayerHistoryLogs: function (endGameBool,numToLog) {
		this.currentPlayer.updateHistory(false, this.round);
		this.otherPlayer.updateHistory(false, this.round);
	},

	playerChooseThisCardFromHand: function(chosenCardID) {
		chosenCard = Card.list[chosenCardID];
		gameplayLogMessage(this.currentPlayer.name + " selected this card: " + chosenCard.displayCard());
		this.currentPlayer.sayAskForCard(chosenCard);

		var cardsFound = this.otherPlayer.giveMatchingCards(chosenCard.rank);
		if (cardsFound.length > 0) {
			//take from opponent
			this.currentPlayer.takeCards(cardsFound,this.otherPlayer);
			gameplayAlertMessage(this.otherPlayer.name + " has " + cardsFound.length + " cards of rank " + chosenCard.rank + "! You take " + cardsFound.length + " cards from " + this.otherPlayer.name + "'s hand.");
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
				this.swapCurrentAndOtherPlayerAssignments(this.player2,this.player1);
					this.UI.swapPlayerUI("player1","player2");
			} else {
				this.round++;
				this.updatePlayerHistoryLogs(false,this.round);
				consoleLogMessage("always","ROUND " + this.round);
				this.UI.swapPlayerUI("player2","player1");
				this.swapCurrentAndOtherPlayerAssignments(this.player1,this.player2);
			}
			gameplayLogMessage(this.currentPlayer.name + "'s turn!");
		}
		this.updatePlayerHistoryLogs(true,0);
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
			if (isPretty === false) { //print debug
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
		gameplayLogMessage("Deck length: " + this.deck.cards.length);
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
		$("#instructions").append("Click a card in your hand. If your opponent doesn't have any cards of matching rank, draw from the deck until you find a match.");
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
		consoleLogMessage("debug"," *debug: " + this.name + "'s hand now contains: " + this.deck.printCardsIn(this.handCards,false));
	},

	sayAskForCard: function(currentCard) {
		var askStr = this.name + ' asks, "Do you have any ' + currentCard.displayRank();
			if (currentCard.rank >= 10 || currentCard.rank == 1) {
				askStr += "s?";
			} else { //it's a number, use apostrophe
				askStr += "'s?";
			}
		gameplayLogMessage(askStr);
	},

	opponentSaysDrink: function(card) {
		var replyStr = this.name + ' replies, "Nope, no '+ card.displayRank() + "'s in my hand. DRINK!";
		gameplayLogMessage(replyStr);
		gameplayAlertMessage(replyStr);
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
				consoleLogMessage("debug"," *debug: this.handCards[i]" + this.handCards[i].displayCard());
				matchingOpponentCards.push(this.handCards.splice(i,1)[0]);
			}
		}
		return matchingOpponentCards; //pass back an array full of matching cards
	},

	findSetOfFour: function (card) {
		//gameplayLogMessage("  Checking for a set of four " + card.displayRank(card.rank) + "s in " + this.name + "'s hand containing " + this.handCards.length + " cards...");
		var matchIndices = [];

		for (i = 0; i < this.handCards.length; i ++) {
			if (card.rank == this.handCards[i].rank) {
				matchIndices.push(i);
				if (debugMode) {
					gameplayLogMessage("    Match found! " + card.displayRank(card.rank) + " matches " + this.handCards[i].displayCard() + ". Total matches so far: " + matchIndices.length);
				}
			} else {
				if (debugMode) {
					gameplayLogMessage("    Not a match. " + card.displayRank(card.rank) + " does not match " + this.handCards[i].displayCard());
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

			var completedSetStr = "Completed a set of 4! Removed these cards: " + theseCardsStr + " from " + this.name + "'s hand.";
			gameplayLogMessage("   " + completedSetStr);
			gameplayAlertMessage(completedSetStr);

			game.UI.updatePlaymat();
			matchesFound = 0;
			matchIndices = [];
		} else {
			gameplayLogMessage("  Did not find a set of four " + card.displayRank(card.rank) + "'s in " + this.name + "'s hand.");
		}
	},

	takeCards: function(cards,otherPlayer) {
		//create the console.log string
		var matchedCardsStr = "";
		for (var i = 0; i < cards.length; i ++ ) {
			matchedCardsStr += " [" + cards[i].displayCard() + "]";
		}
		gameplayLogMessage(otherPlayer.name + ' replies, "Yes, take my:' + matchedCardsStr + '."');
		gameplayLogMessage(this.name + " acquires " + matchedCardsStr + " and checks own hand to see if a set is made...");

		//push from cards array to player hand and check for sets of four
		for (var i = 0; i < cards.length; i ++) {
			this.handCards.push(cards[i]);
			this.findSetOfFour(cards[i]);
		}
		this.sayMyHandContents();
	},

	drinkAuto: function(rank) {
		if (this.deck.cards.length > 0) {
			gameplayLogMessage(this.name + " drinks...");

			for (i = 0; i < this.deck.cards.length; i ++) {
				//draw a card from the face down deck and see if it makes a set of 4
				var drewCard = this.deck.cards[0];
				this.handCards.push(this.deck.cards.shift());
				gameplayLogMessage(this.name + " drew this card from the pile: [" + drewCard.displayCard() + "]");

				if (rank == drewCard.rank) {
					gameplayLogMessage(this.name + " stops drawing cards. " + drewCard.displayCard() + "'s rank matches " + this.name + "'s " + rank + ".");
				}

				this.findSetOfFour(drewCard);

				if (rank == drewCard.rank) { ///if it matches the rank you're looking for, stop drawing
					break;
				}
			}
		} else {
			gameplayLogMessage("No cards to drink from! GAME OVER!");
		}
	},

	drawFromDeck: function() {
		if (this.deck.cards.length > 0) {
			event.stopPropagation();
			gameplayLogMessage(this.name + " drinks...");
			drewCard = this.deck.cards[0];
			this.handCards.push(this.deck.cards.shift());
			game.UI.updatePlaymat();

			var drewCardStr = "You drew a [" + drewCard.displayCard() + "] and added it to your hand!";
			if (drewCard.rank == game.cardRankNeeded) {
				drewCardStr += " You found a card that matches " + game.cardRankNeeded + "! STOP DRAWING";
				gameplayAlertMessage(drewCardStr);
				this.findSetOfFour(drewCard); //does this card finish a set of four? let's check...
				game.UI.disableDeckButton();
				game.endTurnSwapPlayers();
			} else {
				drewCardStr += " Rank mismatch! You need a " + game.cardRankNeeded + " but you drew a " + drewCard.displayRank() + ". Click deck to draw again!";
				gameplayAlertMessage(drewCardStr);
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
    $("#player1NameTitle").html(player1NameVar + "'s hand (Player 1)");
    $("#player2NameTitle").html(player2NameVar + "'s hand (Player 2)");
    game = new Game();
		game.init(player1NameVar,player2NameVar,autoPlay);
}

function gameplayLogMessage(msg) {
	$("#gameplayLog").prepend("<li>" + msg + "</li>").fadeIn("slow");
	consoleLogMessage("always",msg);
}

function gameplayAlertMessage(msg) {
	if (game.autoPlay === false) {
			alert(msg);
		}
}

function consoleLogMessage(showWhen, msg) {
	if (showWhen == "debug") {
		if (debugMode) {
			console.log(msg);
		}
	} else {
		console.log(msg);
	}
}

$( document ).ready(function() {
	$("#playMat").hide();
	$("#logSection").hide();
});



//Resources used
//Fisher Yates randomizer found: http://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
