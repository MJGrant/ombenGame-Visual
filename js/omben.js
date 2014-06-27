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
}

Game.prototype = {
	init: function(player1NameVar,player2NameVar,autoPlay) {

		this.deck = new Deck();
		this.deck.init();

		this.UI = new UI();
		this.UI.init();

		this.player1 = new Player(this.deck, player1NameVar);
		this.player2 = new Player(this.deck, player2NameVar);

		this.player1.init();
		this.player2.init();

		this.currentPlayer = this.player1;
		this.otherPlayer = this.player2;

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
		this.UI.updatePlaymat(this.deck,this.player1,this.player2);
		gameMessage("Starting game");

			if (autoPlay == true) {
				this.autoPlayLoop();
			} else {
				this.playerTurnHuman();
			}
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
				gameOverStr += player1.name + " WINS!";
			} else if (this.player2.handCards.length === 0) {
				gameOverStr += player2.name + " WINS!";
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
			this.currentPlayer.sayDrink(this.currentPlayer,this.otherPlayer,randomCard);
			this.currentPlayer.drink(randomCard.rank);
		}
	},

	swapPlayers: function() {
		if (this.player1.handCards.length > 0 && this.player2.handCards.length > 0 && this.deck.cards.length > 0) {
			this.currentPlayer = this.player1;
			this.otherPlayer = this.player2;
			
			this.UI.updatePlaymat(this.deck,this.player1,this.player2);

			if (this.currentPlayer == this.player2) {
				this.round++;
				this.currentPlayer.updateHistory(false, this.round);
				this.otherPlayer.updateHistory(false, this.round);
				gameMessage("<b>ROUND " + this.round + "</b>");

				this.playerTurnHuman();
			} else {
				this.playerTurnAI();
			}
		} else { //game is won
			this.currentPlayer.updateHistory(true, 0);
			this.otherPlayer.updateHistory(true, 0);
			this.calculateAndPrintWinner(this.deck,this.player1,this.player2);
		}
	},

	playerTurnAI: function() {
		$("#currentTurnAndRound").html("<b>ROUND " + this.round + "</b></br>Current Player: " + this.currentPlayer.name);
		gameMessage(this.currentPlayer.name + "'s turn.");
		$("#instructions").html(this.otherPlayer.name + " is choosing a card...");
		//set current player to green 
		$("#player2").css("background-color","green").css("border","5px solid #00FF7F");
		$("#player1").css("background-color","#BBB").css("border","none");
		this.UI.updatePlaymat(this.deck,this.player1,this.player2);


		var chosenCard = this.currentPlayer.chooseRandomCardFromPlayerHand();
		this.currentPlayer.sayAskForCard(chosenCard);

		var cardsFound = this.otherPlayer.giveMatchingCards(chosenCard.rank);
		if (cardsFound.length > 0) { //take from opponent
			this.currentPlayer.takeCards(cardsFound,this.otherPlayer);
		} else { //no cards found, draw from deck
			this.currentPlayer.sayDrink(this.currentPlayer,this.otherPlayer,chosenCard);
			this.currentPlayer.drink(chosenCard.rank);
		}

		this.swapPlayers();
	},

	playerTurnHuman: function() {
		$("#currentTurnAndRound").html("<b>ROUND " + this.round + "</b></br>Current Player: " + this.currentPlayer.name);
		gameMessage(this.currentPlayer.name + "'s turn.");
		$("#instructions").append("Choose a card to ask your opponent for:");
		$("#player1").css("background-color","green").css("border","5px solid #00FF7F");
		$("#player2").css("background-color","#BBB").css("border","none");
	},

	playerChooseThisCard: function(chosenCardID) {
		chosenCard = Card.list[chosenCardID];
		gameMessage(this.currentPlayer.name + " selected this card: " + chosenCard.displayCard());
		this.currentPlayer.sayAskForCard(chosenCard);

		var cardsFound = this.otherPlayer.giveMatchingCards(chosenCard.rank);
		if (cardsFound.length > 0) { 
			//take from opponent
			this.currentPlayer.takeCards(cardsFound,this.otherPlayer);
		} else { //draw from deck
			this.currentPlayer.sayDrink(this.currentPlayer,this.otherPlayer,chosenCard);
			this.currentPlayer.drink(chosenCard.rank);
		}


		this.swapPlayers();
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
		for (i = 0; i < Card.validSuits.length; i++) {
			for (j = 1; j <= Card.validRanks; j++) {
				var gameCard = new Card(Card.validSuits[i],j);
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

}

UI.prototype = {
	init: function() {
		console.log(Card.list.length);
		for (i = 0; i < Card.list.length; i++) {
			var cardName = Card.list[i].displayCard();
			$("#p1Cards").append("<button class='p1card' id='card" + i +"' value='" + i + "'>"+cardName+"</button>");
				$("#p1Cards").on("click","#card"+i,function() { 
					game.playerChooseThisCard($(this).attr("value"));
				});
			$("#p2Cards").append("<button class='p2card' id='opponentCard"+i+"'>[???]</button>");
				$(".p2card").on("click", "#opponentCard"+i,function() { 
					alert("Opponent cards are secret!");
				});
		}
	},

	showPlaymat: function () {
		$("#setupForm").hide();
    	$("#playMat").fadeIn("slow").css("background-color","#F5F5F5");
    	$("#logSection").fadeIn("slow");
	},

	updatePlaymat: function(deck,player1,player2) {
		//deck button
		gameMessage("Deck length: " + deck.cards.length);
		$("#deckButton").html("DRAW FROM DECK (total: " + deck.cards.length + ")");
		this.updateCardsOnPlaymat(player1,"#card");
		this.updateCardsOnPlaymat(player2,"#opponentCard");
	},

	updateCardsOnPlaymat: function(player,cardIDString) { //todo: refactor to not have to pass ID strings
		idString = cardIDString;
		
		//hide all the cards
		for (i = 0; i < Card.list.length; i ++) {
			$(idString + i).hide();
		}
		//show cards by ID based on what's in player hand
		for (j = 0; j < player.handCards.length; j++) {
			id = player.handCards[j].cardID;
			$(idString + id).show();
			console.log("showing " + player.name + "'s #card" + id);
		}
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

	Card.validSuits = ["Hearts", "Spades", "Clubs", "Diamonds"];
	Card.validRanks = 13;
	

Card.prototype = {
	displayCard: function() {
		var cardStr = "";
		cardStr += this.displayRank();
		return cardStr + " of " + this.suit;
	},

	displayRank: function() {
		var rankStr = "";
		switch (this.rank) {
			case 1:
				rankStr = "Ace";
				break;
			case 11:
				rankStr = "Jack";
				break;
			case 12:
				rankStr = "Queen";
				break;
			case 13:
				rankStr = "King";
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

	sayDrink: function(currentPlayer,otherPlayer,card) {
		var replyStr = otherPlayer.name + ' replies, "Nope, no '+ card.displayRank();
 			//use apostrophe
			if (card.rank >= 10 || card.rank == 1) {
				replyStr += "s ";
			} else { //it's a number, use apostrophe
				replyStr += "'s ";
			}
		replyStr += "in my hand. DRINK!";
		gameMessage(replyStr);
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
			//gameMessage("  Found a set of 4!! Removing four " + card.displayRank(card.rank) + "'s from " + this.name + "'s hand...");
			for (i = 0; i < matchIndices.length; i++) {
				var removeIndex = matchIndices[i];
				theseCardsStr += "[" + this.handCards[removeIndex - i].displayCard() + "] ";
				this.handCards.splice(removeIndex - i,1);
			}

			gameMessage("    Found a set of 4! Removed these cards: " + theseCardsStr + " from " + this.name + "'s hand.");
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

	clickDrink: function(cardToMatch) {
		if (this.deck.cards.length > 0) {
			gameMessage(this.name + " drinks...");

			//draw a card from the deck and move it to player hand
			var drewCard = this.deck.cards[0];
			alert("You drew this card from the deck: " + drewCard); 
			this.handCards.push(this.deck.cards.shift());
			//check if the card finishes a set of 4
			this.findSetOfFour(drewCard);
		}
	},

	drink: function(rank) {
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
}

//==================================================
// Start the game
//==================================================


function startGame (form, autoPlay) {
    var player1NameVar = form.name1.value;
    var player2NameVar = form.name2.value;
    game = new Game();
	game.init(player1NameVar,player2NameVar,autoPlay);
	$("#opponentHandTitle").html("<p>" + player2NameVar + "'s Hand</p>");
}

function gameMessage(msg) {
	$("#gameplayLog").prepend("<li>" + msg + "</li>").fadeIn("slow");
	console.log(msg);
}

$( document ).ready(function() {
	$("#playMat").hide();
	$("#logSection").hide();
});


//Resources used
//Fisher Yates randomizer found: http://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
