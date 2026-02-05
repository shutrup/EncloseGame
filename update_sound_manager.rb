require 'xcodeproj'

project_path = 'Enclose.xcodeproj'
project = Xcodeproj::Project.open(project_path)
target = project.targets.first

path = 'Enclose/Game/SoundManager.swift'
puts "Adding #{path} to target..."
file_ref = project.main_group.new_file(path) // using main_group workaround
target.add_file_references([file_ref])

project.save
puts "Project saved."
