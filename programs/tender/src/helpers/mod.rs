pub fn string_hex_to_buffer (value: String) -> [u8; 32] {
  let mut decoded = [0; 32];
  hex::decode_to_slice(value, &mut decoded).expect("Decoding hex failed");
  return decoded;
}