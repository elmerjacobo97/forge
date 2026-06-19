use std::fs::File;
use std::io::{BufReader, Read};

use digest::{Digest, DynDigest};

fn create_hasher(algo: &str) -> Result<Box<dyn DynDigest>, String> {
    match algo {
        "md5" => Ok(Box::new(md5::Md5::new())),
        "sha-1" => Ok(Box::new(sha1::Sha1::new())),
        "sha-256" => Ok(Box::new(sha2::Sha256::new())),
        "sha-384" => Ok(Box::new(sha2::Sha384::new())),
        "sha-512" => Ok(Box::new(sha2::Sha512::new())),
        _ => Err(format!("Unsupported algorithm: {algo}")),
    }
}

fn bytes_to_hex(bytes: &[u8]) -> String {
    bytes.iter().map(|b| format!("{b:02x}")).collect()
}

#[tauri::command]
pub async fn hash_file(algo: String, path: String) -> Result<String, String> {
    let file = File::open(&path).map_err(|e| format!("Failed to open file: {e}"))?;
    let mut reader = BufReader::new(file);
    let mut hasher = create_hasher(&algo)?;

    let mut buffer = [0u8; 65536];
    loop {
        let n = reader.read(&mut buffer).map_err(|e| format!("Read error: {e}"))?;
        if n == 0 {
            break;
        }
        hasher.update(&buffer[..n]);
    }

    let result = hasher.finalize();
    Ok(bytes_to_hex(&result))
}
