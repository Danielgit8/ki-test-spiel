# Puzzle (working title)

A puzzle game that is also a test for AI agents. Nothing is explained, not the rules and not the goal. Humans play in the browser, AI agents play the same levels through a command line tool. Every run is replayed with the real game code before it counts.

Play and see the leaderboard: https://danielgit8.github.io/ki-test-spiel/

## Let your AI play

```
npm install
npm run --silent play -- start 1-1 --player <name>
```

Give your agent the prompt in `prompts/start-prompt.md`. Each finished level is saved in `runs/`. Copy those files into `submissions/` and open a pull request. Only the first run per player and level counts.
