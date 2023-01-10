//..............Include Express..................................//
const express = require('express');
const fs = require('fs');
const ejs = require('ejs');

//..............Create an Express server object..................//
const app = express();

//..............Apply Express middleware to the server object....//
app.use(express.json()); //Used to parse JSON bodies (needed for POST requests)
app.use(express.urlencoded());
app.use(express.static('public')); //specify location of static assests
app.set('views', __dirname + '/views'); //specify location of templates
app.set('view engine', 'ejs'); //specify templating library

//.............Define server routes..............................//
//Express checks routes in the order in which they are defined

app.get('/', function(request, response) {
  response.status(200);
  response.setHeader('Content-Type', 'text/html')
  response.render("index");
});

app.get('/play', function(request, response) {
    let opponents = JSON.parse(fs.readFileSync('data/opponents.json'));
    response.status(200);
    response.setHeader('Content-Type', 'text/html')
    response.render("play", {
      data: opponents
    });
});

app.get('/results', function(request, response) {
    let opponents = JSON.parse(fs.readFileSync('data/opponents.json'));

    //accessing URL query string information from the request object
    let opponent = request.query.opponent;
    let playerThrow = request.query.throw;

    if(opponents[opponent]){
      let opponentThrowChoices=["Paper", "Rock", "Scissors"];
      let results={};

      results["playerThrow"]=playerThrow;
      results["opponentName"]=opponent;
      results["opponentPhoto"]=opponents[opponent].photo;
      results["opponentThrow"] = opponentThrowChoices[Math.floor(Math.random() * 3)];

      if(results["playerThrow"]===results["opponentThrow"]){
        results["outcome"] = "tie";
      }else if(results["playerThrow"]==="Paper"){
        if(results["opponentThrow"]=="Scissors") results["outcome"] = "lose";
        else results["outcome"] = "win";
      }else if(results["playerThrow"]==="Scissors"){
        if(results["opponentThrow"]=="Rock") results["outcome"] = "lose";
        else results["outcome"] = "win";
      }else{
        if(results["opponentThrow"]=="Paper") results["outcome"] = "lose";
        else results["outcome"] = "win";
      }

      if(results["outcome"]=="lose") opponents[opponent]["win"]++;
      else if(results["outcome"]=="win") opponents[opponent]["lose"]++;
      else opponents[opponent]["tie"]++;

      //update opponents.json to permanently remember results
      fs.writeFileSync('data/opponents.json', JSON.stringify(opponents));

      response.status(200);
      response.setHeader('Content-Type', 'text/html')
      response.render("results", {
        data: results
      });
    }else{
      response.status(404);
      response.setHeader('Content-Type', 'text/html')
      response.render("error", {
        "errorCode":"404"
      });
    }
});

app.get('/scores', function(request, response) {
  let opponents = JSON.parse(fs.readFileSync('data/opponents.json'));
  let opponentArray=[];

  //create an array to use sort, and dynamically generate win percent
  for(name in opponents){
    opponents[name].win_percent = (opponents[name].win/parseFloat(opponents[name].win+opponents[name].lose+opponents[name].tie) * 100).toFixed(2);
    if(opponents[name].win_percent=="NaN") opponents[name].win_percent=0;
    opponentArray.push(opponents[name])
  }
  opponentArray.sort(function(a, b){
    return parseFloat(b.win_percent)-parseFloat(a.win_percent);
  })

  response.status(200);
  response.setHeader('Content-Type', 'text/html')
  response.render("scores",{
    opponents: opponentArray
  });
});

app.get('/recipe/:recipeName', function(request, response) {
  let recipes = JSON.parse(fs.readFileSync('data/recipes.json'));

  // using dynamic routes to specify resource request information
  let recipeName = request.params.recipeName;

  if(recipes[recipeName]){
    response.status(200);
    response.setHeader('Content-Type', 'text/html')
    response.render("recipeDetails",{
      recipe: recipes[recipeName]
    });

  }else{
    response.status(404);
    response.setHeader('Content-Type', 'text/html')
    response.render("error", {
      "errorCode":"404"
    });
  }
});

app.get('/createRecipe', function(request, response) {
    response.status(200);
    response.setHeader('Content-Type', 'text/html')
    response.render("createRecipe")
});

app.post('/createRecipe', function(request, response) {
  let recipesJSON = JSON.parse(fs.readFileSync('data/recipes.json'));
  let recipeName = request.body.recipeName
  let recipePhoto = request.body.recipePhoto
  let recipeAuthor = request.body.recipeAuthor
  let recipeTime = request.body.recipeTime
  let recipeDifficulty = request.body.recipeDifficulty

  if(recipeName && recipePhoto && recipeAuthor && recipeDifficulty && recipeTime){

  let ingredientNames = []
  let ingredientQuantities = []
    for(let i = 1; i < 21; i++){
      let a = "ingredient" + i.toString()
      ingredientNames.push(request.body[a])

      let b = "quantity" + i.toString()
      ingredientQuantities.push(request.body[b])
    }
    
    let newRecipe ={
      recipeName: recipeName,
      recipeAuthor: request.body.recipeAuthor,
      recipeDifficulty: request.body.recipeDifficulty, //integer from a scale of 1 to 3 : beginner, intermediate, expert
      recipeTime: request.body.recipeTime, //minutes, though idk if we're going to validate this
      recipeImage: request.body.recipePhoto,
      recipeIngredientNames: ingredientNames,
      recipeIngredientQuantities: ingredientQuantities,
    }
    recipesJSON[recipeName] = newRecipe
    console.log(recipesJSON)
    fs.writeFileSync('data/recipes.json', JSON.stringify(recipesJSON));
    let commentsJSON = JSON.parse(fs.readFileSync('data/comments.json'));
    commentsJSON[recipeName] = {}
    fs.writeFileSync('data/comments.json', JSON.stringify(commentsJSON));
    response.status(200);
    response.setHeader('Content-Type', 'text/html')
    response.redirect("/recipe/"+recipeName);
  }else{
    response.status(400);
    response.setHeader('Content-Type', 'text/html')
    response.render("error", {
      "errorCode":"400"
    });
  }
    
});

// Because routes/middleware are applied in order,
// this will act as a default error route in case of
// a request fot an invalid route
app.use("", function(request, response){
  response.status(404);
  response.setHeader('Content-Type', 'text/html')
  response.render("error", {
    "errorCode":"404"
  });
});

//..............Start the server...............................//
const port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log('Server started at http://localhost:'+port+'.')
});

/**
 app.get('/yabbadabbadoo')
 */

//

