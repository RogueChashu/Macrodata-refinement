const handleNewNumber = (data, timestamp, div) => {
  data.scaleInStartTime = timestamp;
  data.isScalingIn = true;
  delete data.state;
  div.textContent = '';
}

export default handleNewNumber
