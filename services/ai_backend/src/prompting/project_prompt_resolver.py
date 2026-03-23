from pathlib import Path
from typing import Optional, Dict, Any
import yaml


class ProjectPromptResolver:
    def __init__(
        self,
        projects_dir: Optional[Path] = None,
        assignments_file: Optional[Path] = None,
    ):
        base_dir = Path(__file__).resolve().parents[2]  # services/ai_backend
        self.projects_dir = projects_dir or (base_dir / "config" / "projects")
        self.assignments_file = assignments_file or (base_dir / "config" / "project_assignments.yaml")

        self.assignments = self._load_yaml(self.assignments_file) or {}
        self.project_cache: Dict[str, Dict[str, Any]] = {}

    def _load_yaml(self, path: Path) -> Optional[Dict[str, Any]]:
        if not path.exists():
            return None
        with open(path, "r", encoding="utf-8") as f:
            return yaml.safe_load(f) or {}

    def _load_project(self, project_key: str) -> Optional[Dict[str, Any]]:
        if project_key in self.project_cache:
            return self.project_cache[project_key]

        path = self.projects_dir / f"{project_key}.yaml"
        project = self._load_yaml(path)
        if project:
            self.project_cache[project_key] = project
        return project

    def resolve_for_user(self, user_email: Optional[str]) -> Optional[Dict[str, Any]]:
        if not user_email:
            return None

        user_cfg = (self.assignments.get("users") or {}).get(user_email)
        if not user_cfg:
            return None

        project_key = user_cfg.get("project_key")
        session_number = int(user_cfg.get("session_number", 1))

        project = self._load_project(project_key)
        if not project:
            return None

        sessions = project.get("sessions", {})
        session_cfg = sessions.get(session_number) or sessions.get(str(session_number))
        if not session_cfg:
            return None

        base_prompt = project.get("base_prompt", "").strip()
        session_prompt = session_cfg.get("prompt", "").strip()

        combined_prompt = f"{base_prompt}\n\n{session_prompt}".strip()

        return {
            "project_key": project_key,
            "session_number": session_number,
            "session_title": session_cfg.get("title", f"Session {session_number}"),
            "combined_prompt": combined_prompt,
        }

    def set_session_number(self, user_email: str, session_number: int) -> None:
        self.assignments.setdefault("users", {})
        self.assignments["users"].setdefault(user_email, {})
        self.assignments["users"][user_email]["session_number"] = session_number

        with open(self.assignments_file, "w", encoding="utf-8") as f:
            yaml.safe_dump(self.assignments, f, allow_unicode=True, sort_keys=False)