import { ref } from 'vue'

export function useWebRTC() {
  const myRole = ref(null)
  const connections = ref([])
  const messages = ref([])

  const createPeerConnection = (id) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19030' }]
    })

    pc.onicecandidate = (e) => {
      if (!e.candidate) console.log('ICE収集完了:', id)
    }

    return pc
  }

  const setupDataChannel = (dc, id) => {
    dc.onopen = () => console.log('データチャネル開放:', id)
    dc.onmessage = (e) => {
      const data = JSON.parse(e.data)
      messages.value.push(data)
      if (myRole.value === 'host') {
        connections.value.forEach(conn => {
          if (conn.id !== id && conn.dc && conn.dc.readyState === 'open') {
            conn.dc.send(e.data)
          }
        })
      }
    }
    return dc
  }

  const hostCreateOffer = async () => {
    myRole.value = 'host'
    const id = Math.random().toString(36).substring(7)
    const pc = createPeerConnection(id)
    const dc = setupDataChannel(pc.createDataChannel('chat'), id)
    
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    
    connections.value.push({ id, pc, dc })
    return JSON.stringify(offer)
  }

  const hostReceiveAnswer = async (answerStr) => {
    const lastConn = connections.value[connections.value.length - 1]
    await lastConn.pc.setRemoteDescription(JSON.parse(answerStr))
  }

  const guestJoin = async (offerStr) => {
    myRole.value = 'guest'
    const id = 'host'
    const pc = createPeerConnection(id)
    let dc

    pc.ondatachannel = (e) => {
      dc = setupDataChannel(e.channel, id)
      connections.value.push({ id, pc, dc })
    }

    await pc.setRemoteDescription(JSON.parse(offerStr))
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    return JSON.stringify(answer)
  }

  const sendMessage = (payload) => {
    const data = typeof payload === 'string' ? { type: 'chat', text: payload } : payload
    const msg = JSON.stringify({ sender: myRole.value, ...data })
    
    if (data.type === 'chat') {
      messages.value.push({ sender: myRole.value, ...data })
    }
    
    connections.value.forEach(conn => {
      if (conn.dc && conn.dc.readyState === 'open') {
        conn.dc.send(msg)
      }
    })
  }

  const sendToPeer = (peerId, data) => {
    const msg = JSON.stringify({ sender: myRole.value, ...data })
    const conn = connections.value.find(c => c.id === peerId)
    if (conn && conn.dc && conn.dc.readyState === 'open') {
      conn.dc.send(msg)
    }
  }

  return {
    myRole,
    connections,
    messages,
    hostCreateOffer,
    hostReceiveAnswer,
    guestJoin,
    sendMessage,
    sendToPeer
  }
}