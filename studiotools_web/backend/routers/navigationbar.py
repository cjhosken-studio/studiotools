from flask import jsonify
import os
import pathlib

def navigationbar_routes(app):

    @app.route("/api/projects/get", methods=['GET'])
    def get_projects():
        projects = []

        projects_dir = os.path.join(pathlib.Path.home(), "projects")

        if os.path.exists(projects_dir):
            for project in os.listdir(projects_dir):
                project_path = os.path.join(projects_dir, project)
                if "metadata.json" in os.listdir(project_path):
                    projects.append(
                        {
                            "name": project,
                            "path": project_path
                        })

        return jsonify({"projects": projects})

    @app.route('/api/projects/create', methods=['GET'])
    def create_project():
        projects_dir = os.path.join(pathlib.Path.home(), "projects")

        if not os.path.exists(projects_dir):
            os.mkdir(projects_dir)
    
        return jsonify({"url": "/create/path"})