require 'xcodeproj'

project_path = 'Enclose.xcodeproj'
project = Xcodeproj::Project.open(project_path)

# Find or create UI group
target_group = project.main_group['Enclose']['UI']
# If UI group doesn't exist (it holds BoardView.swift, so it should exist), handle it.
if target_group.nil?
  puts "UI group not found, creating..."
  target_group = project.main_group['Enclose'].new_group('UI', 'UI')
end

# Files to add
files_to_add = [
  'Enclose/UI/GameView.swift',
  'Enclose/UI/SettingsView.swift',
  'Enclose/UI/MainTabView.swift'
]

target = project.targets.first

files_to_add.each do |file_path|
  # visual check
  puts "Adding #{file_path}..."
  file_ref = target_group.new_file(File.basename(file_path))
  target.add_file_references([file_ref])
end

# Remove ContentView.swift
content_view = project.main_group['Enclose'].find_file_by_path('ContentView.swift')
if content_view
  puts "Removing ContentView.swift..."
  content_view.remove_from_project
end

project.save
puts "Project saved."
