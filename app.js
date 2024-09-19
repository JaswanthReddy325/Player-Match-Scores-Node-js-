const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
app.use(express.json())
const path = require('path')
const dbPath = path.join(__dirname, 'cricketMatchDetails.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
const convertToResponse1 = dbObject => {
  return {playerId: dbObject.player_id, playerName: dbObject.player_name}
}
const convertToResponse2 = dbObject => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  }
}
app.get('/players/', async (request, response) => {
  const getBookQuery = `
    SELECT
      *
    FROM
      player_details
   ;`
  const book = await db.all(getBookQuery)
  response.send(
    book.map(each => {
      return convertToResponse1(each)
    }),
  )
})
app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const getBookQuery = `
    SELECT
      player_id as playerId,player_name as playerName
    FROM
      player_details
    WHERE
      player_id = ${playerId};`
  const book = await db.get(getBookQuery)
  response.send(book)
})

app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const bookDetails = request.body
  const {playerName} = bookDetails
  const updateBookQuery = `
    UPDATE
      player_details
    SET
      
      player_name='${playerName}'
    WHERE
      player_id = ${playerId};`
  await db.run(updateBookQuery)
  response.send('Player Details Updated')
})
app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const getBookQuery = `
    SELECT
      match_id as matchId,match,year
    FROM
      match_details
    WHERE
      match_id = ${matchId};`
  const book = await db.get(getBookQuery)
  response.send(book)
})

app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params
  const getAuthorBooksQuery = `
    SELECT
     *
    FROM
     player_match_score natural join match_details
    WHERE
      player_id = ${playerId};`
  const booksArray = await db.all(getAuthorBooksQuery)

  response.send(
    booksArray.map(each => {
      return convertToResponse2(each)
    }),
  )
})

app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params
  const getMatchPlayersQuery = `
	    SELECT
	      player_details.player_id AS playerId,
	      player_details.player_name AS playerName
	    FROM player_match_score NATURAL JOIN player_details
        WHERE match_id=${matchId};`
  const booksArray = await db.all(getMatchPlayersQuery)
  response.send(booksArray)
})

app.get('/players/:playerId/playerScores', async (request, response) => {
  const {playerId} = request.params
  const getPlayerScored = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(player_match_score.fours) AS totalFours,
    SUM(player_match_score.sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_match_score.player_id = ${playerId};
    `

  const booksArray = await db.get(getPlayerScored)
  response.send(booksArray)
})

initializeDBAndServer()
module.exports = app
