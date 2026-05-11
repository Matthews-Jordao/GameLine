import Peer from 'peerjs';

export class RoomManager {
  constructor(onMessage, onPlayerUpdate, onDisconnect, onReconnecting) {
    this.peer = null;
    this.connections = {};
    this.hostConn = null;
    this.isHost = false;
    this.roomCode = null;
    this.myId = '';
    this.myName = '';
    this.myEmoji = '';
    this.players = [];
    this.onMessage = onMessage;
    this.onPlayerUpdate = onPlayerUpdate;
    this.onDisconnect = onDisconnect;
    this.onReconnecting = onReconnecting;
    this._intentionalLeave = false;
    this._reconnectAttempts = 0;
    this._reconnectTimer = null;
    this._disconnectTimers = {};
  }

  _emoji() {
    const pool = ['🐶','🐱','🦊','🐻','🐼','🦁','🐸','🐧','🦄','🐙','🦋','🐬','🐨','🐯','🐺','🦝','🦜','🦔','🐲','🦖'];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  async createRoom(name) {
    return new Promise((resolve, reject) => {
      this.isHost = true;
      this.myName = name;
      this.myEmoji = this._emoji();
      const code = this._genCode();
      this.roomCode = code;
      const peerId = 'pp-' + code;
      this.peer = new Peer(peerId, { debug: 0 });

      this.peer.on('open', (id) => {
        this.myId = id;
        const me = { id, name, emoji: this.myEmoji, isHost: true };
        this.players = [me];
        this.onPlayerUpdate([...this.players]);
        resolve(code);
      });

      this.peer.on('connection', (conn) => this._hostSetup(conn));

      this.peer.on('error', (err) => {
        if (err.type === 'unavailable-id') {
          this.peer.destroy();
          const code2 = this._genCode();
          this.roomCode = code2;
          const peer2 = new Peer('pp-' + code2, { debug: 0 });
          this.peer = peer2;
          peer2.on('open', (id) => {
            this.myId = id;
            const me = { id, name, emoji: this.myEmoji, isHost: true };
            this.players = [me];
            this.onPlayerUpdate([...this.players]);
            resolve(code2);
          });
          peer2.on('connection', (c) => this._hostSetup(c));
          peer2.on('error', reject);
        } else {
          reject(err);
        }
      });
    });
  }

  async joinRoom(code, name) {
    return new Promise((resolve, reject) => {
      this.isHost = false;
      this.myName = name;
      this.myEmoji = this._emoji();
      this.roomCode = code.toUpperCase();
      this.peer = new Peer(undefined, { debug: 0 });

      this.peer.on('open', (id) => {
        this.myId = id;
        this._connectToHost(resolve, reject);
      });

      this.peer.on('error', (err) => {
        if (err.type === 'peer-unavailable') reject(new Error('Room not found — check the code!'));
        else reject(err);
      });
    });
  }

  _connectToHost(resolve, reject) {
    const conn = this.peer.connect('pp-' + this.roomCode, { reliable: true });
    this.hostConn = conn;
    const t = resolve ? setTimeout(() => reject(new Error('Room not found — check the code!')), 9000) : null;

    conn.on('open', () => {
      if (t) clearTimeout(t);
      conn.send({ type: 'JOIN', name: this.myName, emoji: this.myEmoji, id: this.myId });
      if (resolve) resolve();
    });

    conn.on('data', (d) => this._guestData(d));

    conn.on('close', () => {
      if (this._intentionalLeave) return;
      this._scheduleReconnect();
    });

    conn.on('error', () => {
      if (this._intentionalLeave) return;
      this._scheduleReconnect();
    });
  }

  _scheduleReconnect() {
    if (this._reconnectAttempts >= 20) {
      this.onDisconnect?.('Connection lost. Please rejoin the room.');
      return;
    }
    this.onReconnecting?.();
    this._reconnectTimer = setTimeout(() => {
      this._reconnectAttempts++;
      try {
        this._connectToHost(null, null);
      } catch {
        this._scheduleReconnect();
      }
    }, 3000);
  }

  _hostSetup(conn) {
    conn.on('open', () => {
      // Cancel any pending disconnect timer for this peer
      if (this._disconnectTimers[conn.peer]) {
        clearTimeout(this._disconnectTimers[conn.peer]);
        delete this._disconnectTimers[conn.peer];
      }
      this.connections[conn.peer] = conn;
    });

    conn.on('data', (d) => {
      if (d.type === 'JOIN') {
        const isRejoin = d.isRejoin === true;
        const existing = this.players.find(p => p.id === conn.peer);

        if (isRejoin && existing) {
          // Player rejoining — restore their connection, send full state
          conn.send({ type: 'JOINED', players: this.players, yourId: conn.peer });
          this._broadcastExcept(conn.peer, { type: 'PLAYER_LIST', players: this.players });
          this.onMessage({ type: 'PLAYER_REJOINED', player: existing });
          return;
        }

        if (!existing) {
          const player = { id: conn.peer, name: d.name, emoji: d.emoji, isHost: false };
          this.players.push(player);
        }
        this.onPlayerUpdate([...this.players]);
        conn.send({ type: 'JOINED', players: this.players, yourId: conn.peer });
        this._broadcastExcept(conn.peer, { type: 'PLAYER_LIST', players: this.players });
        this.onMessage({ type: 'PLAYER_JOINED', player: this.players.find(p => p.id === conn.peer) }, conn.peer);
      } else {
        this._broadcastExcept(conn.peer, { ...d, _from: conn.peer });
        this.onMessage(d, conn.peer);
      }
    });

    conn.on('close', () => {
      const disconnectedPlayer = this.players.find(p => p.id === conn.peer);
      const name = disconnectedPlayer?.name || 'A player';

      // Give 30s grace period before removing — allows reconnect without disrupting game
      this._disconnectTimers[conn.peer] = setTimeout(() => {
        delete this.connections[conn.peer];
        delete this._disconnectTimers[conn.peer];
        this.players = this.players.filter(p => p.id !== conn.peer);
        this.onPlayerUpdate([...this.players]);
        this._broadcast({ type: 'PLAYER_LIST', players: this.players });
        this.onDisconnect?.(`${name} left the game`);
      }, 30000);
    });
  }

  _guestData(d) {
    if (d.type === 'JOINED') {
      this._reconnectAttempts = 0;
      this.players = d.players;
      this.onPlayerUpdate([...this.players]);
    } else if (d.type === 'PLAYER_LIST') {
      this.players = d.players;
      this.onPlayerUpdate([...this.players]);
    } else {
      this.onMessage(d, d._from || 'host');
    }
  }

  _broadcast(msg) {
    Object.values(this.connections).forEach(c => { try { c.send(msg); } catch {} });
  }

  _broadcastExcept(skip, msg) {
    Object.entries(this.connections).forEach(([id, c]) => {
      if (id !== skip) { try { c.send(msg); } catch {} }
    });
  }

  send(msg) {
    if (this.isHost) {
      this._broadcast({ ...msg, _from: this.myId });
      this.onMessage(msg, this.myId);
    } else {
      if (this.hostConn?.open) this.hostConn.send({ ...msg, _from: this.myId });
    }
  }

  sendTo(peerId, msg) {
    const c = this.connections[peerId];
    if (c) { try { c.send(msg); } catch {} }
  }

  destroy() {
    this._intentionalLeave = true;
    clearTimeout(this._reconnectTimer);
    Object.values(this._disconnectTimers).forEach(t => clearTimeout(t));
    try { this.peer?.destroy(); } catch {}
  }

  _genCode() {
    return Math.random().toString(36).substring(2, 6).toUpperCase();
  }
}
