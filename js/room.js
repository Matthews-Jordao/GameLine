// ==============================
// ROOM MANAGER — PeerJS P2P
// ==============================

export class RoomManager {
  constructor(onMessage, onPlayerUpdate, onDisconnect) {
    this.peer = null;
    this.connections = {};  // peerId -> DataConnection (host)
    this.hostConn = null;   // guest only
    this.isHost = false;
    this.roomCode = null;
    this.myId = '';
    this.myName = '';
    this.players = [];
    this.onMessage = onMessage;
    this.onPlayerUpdate = onPlayerUpdate;
    this.onDisconnect = onDisconnect;
  }

  _emoji() {
    const pool = ['🐶','🐱','🦊','🐻','🐼','🦁','🐸','🐧','🦄','🐙','🦋','🐬','🐨','🐯','🐺','🦝','🦜','🦔','🐲','🦖'];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  async createRoom(name) {
    return new Promise((resolve, reject) => {
      this.isHost = true;
      this.myName = name;
      const code = this._genCode();
      this.roomCode = code;
      const peerId = 'pp-' + code;
      this.peer = new Peer(peerId, { debug: 0 });

      this.peer.on('open', (id) => {
        this.myId = id;
        const me = { id, name, emoji: this._emoji(), isHost: true };
        this.players = [me];
        this.onPlayerUpdate([...this.players]);
        resolve(code);
      });

      this.peer.on('connection', (conn) => this._hostSetup(conn));

      this.peer.on('error', (err) => {
        if (err.type === 'unavailable-id') {
          // retry with new code
          this.peer.destroy();
          const code2 = this._genCode();
          this.roomCode = code2;
          const peer2 = new Peer('pp-' + code2, { debug: 0 });
          this.peer = peer2;
          peer2.on('open', (id) => {
            this.myId = id;
            const me = { id, name, emoji: this._emoji(), isHost: true };
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
      this.roomCode = code.toUpperCase();
      this.peer = new Peer(undefined, { debug: 0 });

      this.peer.on('open', (id) => {
        this.myId = id;
        const conn = this.peer.connect('pp-' + this.roomCode, { reliable: true });
        this.hostConn = conn;
        const t = setTimeout(() => reject(new Error('Room not found — check the code!')), 9000);

        conn.on('open', () => {
          clearTimeout(t);
          conn.send({ type: 'JOIN', name, emoji: this._emoji(), id });
          resolve();
        });
        conn.on('data', (d) => this._guestData(d));
        conn.on('close', () => this.onDisconnect?.('Lost connection to host'));
        conn.on('error', reject);
      });

      this.peer.on('error', (err) => {
        if (err.type === 'peer-unavailable') reject(new Error('Room not found — check the code!'));
        else reject(err);
      });
    });
  }

  _hostSetup(conn) {
    conn.on('open', () => { this.connections[conn.peer] = conn; });

    conn.on('data', (d) => {
      if (d.type === 'JOIN') {
        const player = { id: conn.peer, name: d.name, emoji: d.emoji, isHost: false };
        this.players.push(player);
        this.onPlayerUpdate([...this.players]);
        // Tell joiner they're in + player list
        conn.send({ type: 'JOINED', players: this.players, yourId: conn.peer });
        // Tell everyone else
        this._broadcastExcept(conn.peer, { type: 'PLAYER_LIST', players: this.players });
        this.onMessage({ type: 'PLAYER_JOINED', player }, conn.peer);
      } else {
        // relay to all, also deliver locally to host
        this._broadcastExcept(conn.peer, { ...d, _from: conn.peer });
        this.onMessage(d, conn.peer);
      }
    });

    conn.on('close', () => {
      delete this.connections[conn.peer];
      this.players = this.players.filter(p => p.id !== conn.peer);
      this.onPlayerUpdate([...this.players]);
      this._broadcast({ type: 'PLAYER_LIST', players: this.players });
    });
  }

  _guestData(d) {
    if (d.type === 'JOINED') {
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
    Object.values(this.connections).forEach(c => { try { c.send(msg); } catch(e){} });
  }

  _broadcastExcept(skip, msg) {
    Object.entries(this.connections).forEach(([id, c]) => {
      if (id !== skip) { try { c.send(msg); } catch(e){} }
    });
  }

  // Public: send a message (host broadcasts, guest sends to host)
  send(msg) {
    if (this.isHost) {
      this._broadcast({ ...msg, _from: this.myId });
      this.onMessage(msg, this.myId);
    } else {
      if (this.hostConn?.open) this.hostConn.send({ ...msg, _from: this.myId });
    }
  }

  sendTo(peerId, msg) {
    if (this.connections[peerId]) {
      try { this.connections[peerId].send(msg); } catch(e){}
    }
  }

  destroy() { try { this.peer?.destroy(); } catch(e){} }

  _genCode() {
    return Math.random().toString(36).substring(2, 6).toUpperCase();
  }
}
