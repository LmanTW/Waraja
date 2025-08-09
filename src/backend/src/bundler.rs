use zip::{write::FileOptions, CompressionMethod, ZipWriter, ZipArchive};
use std::io::{BufReader, Read, Write};
use serde::Deserialize;
use std::path::Path;
use std::fs::File;
use std::fs;

#[derive(Deserialize)]
#[serde(tag = "type", content = "value")]
pub enum FileContent {
    Data(String),
    Path(String),
}

#[derive(Deserialize)]
pub struct FileEntry {
    pub file_content: FileContent,
    pub bundled_path: String,
}

#[tauri::command]
pub fn bundle(entries: Vec<FileEntry>, output_file_path: String) -> Result<(), String> {
    let output = File::create(&output_file_path)
        .map_err(|_| format!("Failed to create the output file: {}", output_file_path))?;

    let mut zip = ZipWriter::new(output);
    let options = FileOptions::<()>::default().compression_method(CompressionMethod::Deflated);

    for (_, entry) in entries.into_iter().enumerate() {
        match entry.file_content {
            FileContent::Data(file_data) => {
                zip.start_file(&entry.bundled_path, options)
                    .map_err(|_| format!("Failed to write the file: {}",  file_data))?;
                zip.write_all(file_data.as_bytes())
                    .map_err(|_| format!("Failed to write content of: {}", file_data))?;
            },

            FileContent::Path(file_path) => {
                let mut file = File::open(&file_path)
                    .map_err(|_| format!("Failed to open the file: {}", file_path))?;
                let mut buffer = Vec::new();

                file.read_to_end(&mut buffer)
                    .map_err(|_| format!("Failed to read the file: {}", file_path))?;
                zip.start_file(&entry.bundled_path, options)
                    .map_err(|_| format!("Failed to write the file: {}",  file_path))?;
                zip.write_all(&buffer)
                    .map_err(|_| format!("Failed to write content of: {}", file_path))?;
            },
        }
    }

    return Ok(())
}

#[tauri::command]
pub fn unbundle(file_path: String, output_folder_path: String) -> Result<(), String> {
    let file = File::open(&file_path).map_err(|_| format!("Failed to open the file: {}", file_path))?;
    let mut zip = ZipArchive::new(BufReader::new(file)).map_err(|error| format!("Invalid zip archive: {}", error))?;

    for i in 0..zip.len() {
        let mut file = zip.by_index(i).map_err(|error| format!("Failed to read zip entry: {}", error))?;
        let output_path = Path::new(&output_folder_path).join(file.name());

        if file.name().ends_with('/') {
            fs::create_dir_all(&output_path).map_err(|_| format!("Failed to create the folder: {}", output_path.display()))?;
        } else {
            if let Some(parent) = output_path.parent() {
                fs::create_dir_all(parent).map_err(|_| format!("Failed to create parent directory: {}", output_path.display()))?;
            }

            let mut output_file = File::create(&output_path).map_err(|_| format!("Failed to create the file: {}", output_path.display()))?;
            std::io::copy(&mut file, &mut output_file).map_err(|_| format!("Failed to write the file: {}", output_path.display()))?;
        }
    }

    return Ok(())
}
