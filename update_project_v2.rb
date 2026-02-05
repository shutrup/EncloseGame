require 'xcodeproj'

project_path = 'Enclose.xcodeproj'
project = Xcodeproj::Project.open(project_path)
target = project.targets.first

files_to_add = [
  'Enclose/UI/GameView.swift',
  'Enclose/UI/SettingsView.swift',
  'Enclose/UI/MainTabView.swift'
]

files_to_add.each do |path|
  puts "Adding #{path} to target..."
  # Create a reference in the main group (root) pointing to the file
  file_ref = project.main_group.new_file(path)
  
  # Add to compile sources phase
  target.add_file_references([file_ref])
end

project.save
puts "Project saved."
