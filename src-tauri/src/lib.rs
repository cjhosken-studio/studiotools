use std::env;
use std::path::{Path, PathBuf};
use std::process::Command;

#[cfg(windows)]
const SEP: &str = ";";
#[cfg(unix)]
const SEP: &str = ":";

pub fn append_env_var(key: &str, value: &str) -> String {
    let current = env::var(key).unwrap_or_default();
    if current.is_empty() {
        value.to_string()
    } else {
        format!("{}{}{}", current, SEP, value)
    }
}

//
// ---------------------------------------------------------
// Cross-platform symlink
// ---------------------------------------------------------
//
#[tauri::command]
fn symlink(asset: String, symlink: String) -> Result<(), String> {
    let asset_path = Path::new(&asset);
    let link_path = Path::new(&symlink);

    #[cfg(target_os = "windows")]
    {
        if let Err(e) = std::os::windows::fs::symlink_dir(asset_path, link_path) {
            return Err(format!("failed to create symlink: {}", e));
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        use std::os::unix::fs::symlink;
        if let Err(e) = symlink(asset_path, link_path) {
            return Err(format!("failed to create symlink: {}", e));
        }
    }

    Ok(())
}

//
// ---------------------------------------------------------
// Utility: run a program directly without shell (Windows-safe)
// ---------------------------------------------------------
//
pub fn run_direct(program: &Path, args: &[String], envs: &[(&str, String)]) {
    let mut cmd = Command::new(program);
    cmd.args(args);

    for (k, v) in envs {
        cmd.env(k, v);
    }

    let status = cmd.status().expect("Failed to execute child process");
    if !status.success() {
        eprintln!("Process returned non-zero exit code.");
    }
}

//
// ---------------------------------------------------------
// Find Blender’s internal Python (Windows + Linux)
// ---------------------------------------------------------
//
pub fn find_blender_python(blender_exe: &Path, is_windows: bool) -> PathBuf {
    let parent = blender_exe.parent().unwrap();

    let version_dir = std::fs::read_dir(parent)
        .unwrap()
        .filter_map(|e| e.ok())
        .find(|entry| {
            let binding = entry.file_name();
            let name = binding.to_string_lossy();
            name.chars().next().map(|c| c.is_ascii_digit()).unwrap_or(false)
                && entry.path().join("python/bin").exists()
        });

    let python_root = if let Some(dir) = version_dir {
        dir.path().join("python/bin")
    } else {
        return if is_windows {
            PathBuf::from("python.exe")
        } else {
            PathBuf::from("python3")
        };
    };

    if is_windows {
        let exe = python_root.join("python.exe");
        if exe.exists() { exe } else { PathBuf::from("python.exe") }
    } else {
        let candidates = ["python3.11", "python3.10", "python3.9", "python3"];
        for c in candidates {
            let found = python_root.join(c);
            if found.exists() {
                return found;
            }
        }
        PathBuf::from("python3")
    }
}

//
// ---------------------------------------------------------
// Launch command (main entry point called from JS)
// ---------------------------------------------------------
//
#[tauri::command]
fn launch(executable: String, id: String, path: String) {
    let exe_path = PathBuf::from(&executable);
    let is_windows = cfg!(target_os = "windows");
    let submodules_path = append_env_var("PYTHONPATH", "./tools");

    println!("Launching: {} {}", id, executable);

    //
    // ---------------------------------------------------------
    // 1 — BLENDER
    // ---------------------------------------------------------
    //
    if id == "blender" {
        let load_script = Path::new("./tools/blender_studiotools/load.py")
            .canonicalize()
            .unwrap();

        let requirements = Path::new("./tools/blender_studiotools/requirements.txt")
            .canonicalize()
            .unwrap();

        let blender_python = find_blender_python(&exe_path, is_windows);

        //
        // Ensure pip exists
        //
        run_direct(
            &blender_python,
            &["-m".into(), "ensurepip".into()],
            &[],
        );

        //
        // Install Python requirements
        //
        run_direct(
            &blender_python,
            &[
                "-m".into(),
                "pip".into(),
                "install".into(),
                "-r".into(),
                requirements.to_string_lossy().to_string(),
            ],
            &[],
        );

        //
        // Launch Blender normally with the load script
        //
        let mut cmd = Command::new(&exe_path);
        cmd.args([
            path.clone(),
            "--python-use-system-env".into(),
            "--python".into(),
            load_script.to_string_lossy().to_string(),
        ]);

        cmd.env("PYTHONPATH", submodules_path);
        cmd.env("INPIPE", "true");

        let status = cmd.status().expect("Failed to launch Blender");
        if !status.success() {
            eprintln!("Blender exited with non-zero code.");
        }

        return;
    }

    //
    // ---------------------------------------------------------
    // 2 — USDVIEW
    // ---------------------------------------------------------
    //
    if id == "usdview" {
        let usdview_bin = if is_windows {
            PathBuf::from("c:/Program Files/Side Effects Software/Houdini 20.5.332/bin/usdview")
        } else {
            PathBuf::from("usdview")
        };

        let usdview_envs: Vec<(&str, String)> = if is_windows {
            vec![(
                "PATH",
                "c:/Program Files/Side Effects Software/Houdini 20.5.332/bin".to_string(),
            )]
        } else {
            vec![]
        };

        run_direct(
            &usdview_bin,
            &[path.clone()],
            &usdview_envs,
        );
    }
}

// ---------------------------------------------------------
// Tauri application
// ---------------------------------------------------------
//
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![launch, symlink])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}