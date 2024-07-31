import React, { useState } from 'react';
import { ArrowUp, ArrowDown, Minus, Plus, Trash2 } from 'lucide-react';

const WhistScoreKeeper = () => {
  const [players, setPlayers] = useState(['', '', '', '']);
  const [currentScreen, setCurrentScreen] = useState('playerNames');
  const [rounds, setRounds] = useState([]);
  const [currentBids, setCurrentBids] = useState({});
  const [currentTricks, setCurrentTricks] = useState({});
  const [phase, setPhase] = useState('leadBidder');
  const [error, setError] = useState('');
  const [leadBidder, setLeadBidder] = useState(null);
  const [leadBid, setLeadBid] = useState(5);
  const [leadSuit, setLeadSuit] = useState('♠');

  const suits = ['♠', '♥', '♦', '♣', 'NT'];

  const handlePlayerNameChange = (index, name) => {
    const newPlayers = [...players];
    newPlayers[index] = name;
    setPlayers(newPlayers);
  };

  const startGame = () => {
    if (players.every(player => player.trim() !== '')) {
      setCurrentScreen('gamePlay');
      setPhase('leadBidder');
      setCurrentBids(Object.fromEntries(players.map(player => [player, 0])));
      setError('');
    } else {
      setError("Please enter names for all players.");
    }
  };

  const handleValueChange = (player, change, isBidPhase) => {
    const updateFunction = isBidPhase ? setCurrentBids : setCurrentTricks;
    updateFunction(prev => {
      const newValues = {
        ...prev,
        [player]: Math.max(0, Math.min(13, (prev[player] || 0) + change))
      };
      if (!isBidPhase) {
        const totalTricks = Object.values(newValues).reduce((sum, tricks) => sum + tricks, 0);
        setError(totalTricks === 13 ? '' : "The total sum of tricks must be 13.");
      }
      return newValues;
    });
  };

  const submitLeadBidder = () => {
    if (!leadBidder) {
      setError("Please select a lead bidder.");
      return;
    }
    setCurrentBids(prev => ({ ...prev, [leadBidder]: leadBid }));
    setPhase('bid');
    setError('');
  };

  const submitBids = () => {
    const totalBids = Object.values(currentBids).reduce((sum, bid) => sum + bid, 0);
    if (totalBids === 13) {
      setError("The combined sum of bids cannot be 13. Please adjust the bids.");
      return;
    }
    setRounds(prev => [...prev, { bids: {...currentBids}, tricks: {}, scores: {}, totalBids, leadBidder, leadSuit }]);
    setCurrentTricks({...currentBids});
    setPhase('trick');
    setError('');
  };

  const calculateScore = (bid, tricks, totalBids, anyPlayerMetBid) => {
    if (!anyPlayerMetBid) return 0;
    if (bid === 0) return tricks === 0 ? (totalBids < 13 ? 50 : 25) : (tricks >= 6 ? 0 : [-50, -40, -30, -20, -10][tricks - 1]);
    return bid === tricks ? 10 + bid * bid : -10 * Math.abs(bid - tricks);
  };

  const submitTricks = () => {
    const totalTricks = Object.values(currentTricks).reduce((sum, tricks) => sum + tricks, 0);
    if (totalTricks !== 13) {
      setError("The total sum of tricks must be 13. Please adjust the tricks.");
      return;
    }

    setRounds(prevRounds => {
      const newRounds = [...prevRounds];
      const currentRound = newRounds[newRounds.length - 1];
      currentRound.tricks = {...currentTricks};
      const prevScores = newRounds.length > 1 ? newRounds[newRounds.length - 2].scores : {};
      currentRound.scores = {...prevScores};

      const anyPlayerMetBid = players.some(player => currentRound.bids[player] === currentTricks[player]);

      players.forEach(player => {
        const score = calculateScore(currentRound.bids[player], currentTricks[player], currentRound.totalBids, anyPlayerMetBid);
        currentRound.scores[player] = (currentRound.scores[player] || 0) + score;
      });

      return newRounds;
    });

    setCurrentBids(Object.fromEntries(players.map(player => [player, 0])));
    setCurrentTricks({});
    setLeadBidder(null);
    setLeadBid(5);
    setLeadSuit('♠');
    setPhase('leadBidder');
    setError('');
  };

  const deleteCurrentRound = () => {
    setRounds(prevRounds => {
      const newRounds = prevRounds.slice(0, -1);
      setPhase('leadBidder');
      setLeadBidder(null);
      setLeadBid(5);
      setLeadSuit('♠');
      setCurrentBids(Object.fromEntries(players.map(player => [player, 0])));
      setCurrentTricks({});
      return newRounds;
    });
  };

  const renderPlayerNameScreen = () => (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold text-center">Enter Player Names</h2>
      <div className="grid grid-cols-2 gap-4">
        {players.map((player, index) => (
          <input
            key={index}
            type="text"
            placeholder={`Player ${index + 1}`}
            value={player}
            onChange={(e) => handlePlayerNameChange(index, e.target.value)}
            className="p-2 border border-gray-300 rounded"
          />
        ))}
      </div>
      <button onClick={startGame} className="p-2 bg-green-500 text-white rounded">Start Game</button>
    </div>
  );

  const renderLeadBidderSelection = () => (
    <div className="border-2 border-green-500 rounded-lg p-4">
      <h3 className="text-xl font-semibold text-center mb-4">Select Lead Bidder</h3>
      <div className="grid grid-cols-2 gap-4 mb-4">
        {players.map(player => (
          <button
            key={player}
            onClick={() => setLeadBidder(player)}
            className={`p-2 rounded ${leadBidder === player ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
          >
            {player}
          </button>
        ))}
      </div>
      {leadBidder && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span>Lead Bid:</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setLeadBid(Math.max(5, leadBid - 1))} className="p-2 bg-green-500 text-white rounded"><Minus size={16} /></button>
              <span className="px-4 py-2 bg-white border border-gray-300 rounded">{leadBid}</span>
              <button onClick={() => setLeadBid(Math.min(13, leadBid + 1))} className="p-2 bg-green-500 text-white rounded"><Plus size={16} /></button>
            </div>
          </div>
          <div className="flex items-center">
            <span className="mr-4">Trump:</span>
            <div className="flex flex-wrap gap-2">
              {suits.map(suit => (
                <button
                  key={suit}
                  onClick={() => setLeadSuit(suit)}
                  className={`p-2 rounded ${leadSuit === suit ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
                >
                  {suit}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      <button onClick={submitLeadBidder} className="mt-4 p-2 bg-green-500 text-white rounded w-full">Confirm Lead Bidder</button>
    </div>
  );

  const renderGamePlayScreen = () => (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-center">Round {rounds.length}</h2>
        {phase === 'leadBidder' ? renderLeadBidderSelection() : (
          <div className="border-2 border-green-500 rounded-lg p-4">
            <h3 className="text-xl font-semibold text-center mb-4">{phase === 'bid' ? `Bids (${leadSuit})` : "Tricks"}</h3>
            <div className="grid grid-cols-2 gap-4">
              {players.map(player => (
                <div key={player} className="flex flex-col items-center">
                  <label className="mb-1">{player}:</label>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleValueChange(player, -1, phase === 'bid')} className="p-2 bg-green-500 text-white rounded"><Minus size={16} /></button>
                    <span className="px-4 py-2 bg-white border border-gray-300 rounded">{phase === 'bid' ? currentBids[player] : currentTricks[player]}</span>
                    <button onClick={() => handleValueChange(player, 1, phase === 'bid')} className="p-2 bg-green-500 text-white rounded"><Plus size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={phase === 'bid' ? submitBids : submitTricks} className="mt-4 p-2 bg-green-500 text-white rounded w-full">
              Submit {phase === 'bid' ? "Bids" : "Tricks"}
            </button>
          </div>
        )}
      </div>
      
      <div className="overflow-x-auto">
        <h3 className="text-xl font-bold mb-2 text-center">Score Table</h3>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border border-gray-300 p-2 text-center"></th>
              {players.map(player => (
                <th key={player} className="border border-gray-300 p-2 text-center">{player}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rounds.map((round, index) => (
              <React.Fragment key={index}>
                <tr>
                  <td colSpan={players.length + 1} className="border border-gray-300 p-2 bg-gray-100 text-center">
                    <div className="flex items-center justify-between">
                      <span>Round {index} {round.totalBids > 13 ? <ArrowUp className="inline" /> : <ArrowDown className="inline" />}</span>
                      <span>Lead: {round.leadBidder} ({round.bids[round.leadBidder]} {round.leadSuit})</span>
                      {index === rounds.length - 1 && phase === 'leadBidder' && (
                        <button
                          onClick={deleteCurrentRound}
                          className="p-1 bg-red-500 text-white rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 text-center">Bid</td>
                  {players.map(player => (
                    <td key={player} className="border border-gray-300 p-2 text-center">{round.bids[player]}</td>
                  ))}
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 text-center">Tricks</td>
                  {players.map(player => (
                    <td key={player} className="border border-gray-300 p-2 text-center">{round.tricks[player] || '-'}</td>
                  ))}
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 text-center">Score</td>
                  {players.map(player => (
                    <td key={player} className="border border-gray-300 p-2 text-center">{round.scores[player] || 0}</td>
                  ))}
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto p-4 bg-amber-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-center text-amber-800">Whist Score Keeper</h1>
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-center" role="alert">{error}</div>}
      {currentScreen === 'playerNames' ? renderPlayerNameScreen() : renderGamePlayScreen()}
    </div>
  );
};

export default WhistScoreKeeper;
