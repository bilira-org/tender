use sha3::{Digest, Keccak256};

pub fn string_hex_to_buffer (value: String) -> [u8; 32] {
  let mut decoded = [0; 32];
  hex::decode_to_slice(value, &mut decoded).expect("Decoding hex failed");
  return decoded;
}

pub fn hash_with_keccak256 (str: String) -> [u8; 32] {
  let mut hasher = Keccak256::new();

  hasher.update(str);

  let result_hash = hasher.finalize();
  return result_hash.as_slice().try_into().unwrap();
}