let readMode = false


async function openPort() {
  const port = await navigator.serial.requestPort();
  await port.open({ baudRate: 9600 });

  return port
}


async function readFromPort(port) {
  const reader = port.readable.getReader();
  
  while (true) {
    if (readMode) {
      try {
        const { value, done } = await reader.read();
        
        if (done) {
          reader.releaseLock();
          break;
        }
        
        const text = new TextDecoder('utf-8').decode(value);
        
        document.body.append(text);
      } catch (err) {
        console.error('Error reading from port:', err);
        reader.releaseLock();
        break;
      }
    }
  }
  
  reader.releaseLock();
}


async function writeToPort(port, message) {
  // Ensure the port is writable
  if (!port.writable) {
      console.error('Port is not writable');
      return;
  }

  // Get a writer from the port's writable stream
  const writer = port.writable.getWriter();

  try {
      // Convert the message string into a Uint8Array for sending
      const encoder = new TextEncoder('utf-8');
      const data = encoder.encode(message);

      // Write data to the port
      await writer.write(data);
  } catch (err) {
      console.error('Failed to write to port:', err);
  } finally {
      // Always release the writer to free up resources
      writer.releaseLock();
  }
}


window.addEventListener('load', event=>{
  const connect = document.getElementById('connect');
  const command = document.getElementById('command');
  const open = document.getElementById('open');
  const send = document.getElementById('send');

  let port


  
  connect.addEventListener('click', async(event)=>{
    readMode = !readMode

    if (readMode) {
      await readFromPort(port);
      connect.innerHTML = 'Disconnect'
    } else {
      connect.innerHTML = 'Connect'
    }
  })

  open.addEventListener('click', async(event)=>{
    port = await openPort();
  })

  send.addEventListener('click', async(event)=>{
    readMode = false

    // wait for reading to stop
    await new Promise(res => setTimeout(res, 100));

    await writeToPort(port, command.value);
    
    readMode = true
  })
})