function fixWhitespace(string) {
  const arr = string.split("");

  arr[15] = " ";
  arr[16] = " ";
  arr[17] = " ";
  const output = arr.join("");

  return output;
}

module.exports = fixWhitespace;

//EXPLANATION
// in the TLE data, the second term gives info about the vehicle launch, the launch date and which piece of the
//launch vehicle is denoted by the final letter. For launches that have more than 26 pieces (so debris fields with thousands
// of pieces for example) an extra letter is used to count in base 26, the an extra etc. This extra letter takes up a piece of the
//whitespace (normally 3 spaces) after, so reducing the gap between this and the next term to 2 spaces - the TLE calc I imported
//I believe relies on a string split after 3 white spaces to grab the values to calculate its output, so fails for items with
// more than one letter designator (AB etc). This function restores the whitespace as the actual long lat alt calculation
// doesn't need this second term intact.
