require 'xcodeproj'

project_path = 'Enclose.xcodeproj'
project = Xcodeproj::Project.open(project_path)
target = project.targets.first

file_name = 'TutorialOverlayView.swift'
file_ref = project.files.find { |f| f.path == "Enclose/UI/#{file_name}" }

if file_ref
  puts "Removing #{file_name} from project..."
  target.source_build_phase.remove_file_reference(file_ref)
  file_ref.remove_from_project
  project.save
  puts "Project saved."
else
  puts "#{file_name} not found in project (already deleted?)."
end
