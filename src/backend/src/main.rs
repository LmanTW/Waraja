#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use sha2::{Sha256, Digest};
use std::io::{BufReader};
use std::fs::File;
use std::io::Read;
use hex::encode;

mod bundler;

#[tauri::command]
fn hash_file(file_path: String) -> Result<String, String> {
    let file = File::open(&file_path)
        .map_err(|_| format!("Failed to open the file: {}", file_path))?;

    let mut reader = BufReader::new(file);
    let mut hasher = Sha256::new();
    let mut buffer = [0u8; 8192];

    loop {
        let bytes_read = reader.read(&mut buffer)
            .map_err(|_| format!("Failed to read the file: {}", file_path))?;

        if bytes_read == 0 {
            break;
        }

        hasher.update(&buffer[..bytes_read]);
    }

    Ok(encode(hasher.finalize()))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![hash_file, bundler::bundle, bundler::unbundle])
        .run(tauri::generate_context!())
        .expect("Error while running Waraja");
}
