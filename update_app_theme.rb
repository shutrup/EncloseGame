require 'xcodeproj'

begin
  project_path = 'Enclose.xcodeproj'
  project = Xcodeproj::Project.open(project_path)
  target = project.targets.first
  
  file_name = 'AppTheme.swift'
  existing = target.source_build_phase.files.find { |f| f.file_ref && f.file_ref.display_name == file_name }
  if existing
    puts "Already added."
    exit 0 
  end

  path = 'Enclose/UI/AppTheme.swift'
  puts "Adding #{path} to target..."
  file_ref = project.main_group.new_file(path)
  target.add_file_references([file_ref])

  project.save
  puts "Project saved."
rescue => e
  puts "Error: #{e.message}"
  exit 1
end
