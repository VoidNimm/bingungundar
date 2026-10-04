use tauri::Manager;
use tauri_plugin_shell::ShellExt;
use std::sync::Mutex;

struct SidecarState(Mutex<Option<tauri_plugin_shell::process::CommandChild>>);

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(SidecarState(Mutex::new(None)))
        .setup(|app| {
            // Spawn Go backend sidecar on app start
            let sidecar = app.shell()
                .sidecar("baak-api")
                .expect("Failed to create sidecar command");

            let (mut rx, child) = sidecar
                .spawn()
                .expect("Failed to spawn baak-api sidecar");

            // Store child process for cleanup
            let state = app.state::<SidecarState>();
            *state.0.lock().unwrap() = Some(child);

            // Log sidecar output in background
            tauri::async_runtime::spawn(async move {
                use tauri_plugin_shell::process::CommandEvent;
                while let Some(event) = rx.recv().await {
                    match event {
                        CommandEvent::Stdout(line) => {
                            println!("[baak-api] {}", String::from_utf8_lossy(&line));
                        }
                        CommandEvent::Stderr(line) => {
                            eprintln!("[baak-api:err] {}", String::from_utf8_lossy(&line));
                        }
                        CommandEvent::Terminated(payload) => {
                            println!("[baak-api] terminated: {:?}", payload);
                            break;
                        }
                        _ => {}
                    }
                }
            });

            Ok(())
        })
        .on_window_event(|window, event| {
            // Kill sidecar when app window closes
            if let tauri::WindowEvent::Destroyed = event {
                if let Some(child) = window.state::<SidecarState>().0.lock().unwrap().take() {
                    let _ = child.kill();
                    println!("[tauri] baak-api sidecar killed");
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
