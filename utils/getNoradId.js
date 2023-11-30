function getNoradId(tle) {
  if (tle) {
    const id = tle.substr(2, 5);

    return id;
  } else {
    return;
  }
}

module.exports = getNoradId;
