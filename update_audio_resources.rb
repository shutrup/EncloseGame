require 'xcodeproj'

project_path = 'Enclose.xcodeproj'
project = Xcodeproj::Project.open(project_path)
target = project.targets.first

sounds = ['pop.mp3', 'capture.mp3', 'win.mp3', 'loss.mp3']
resource_group = project.main_group['Enclose']['Resources']

if resource_group.nil?
  puts "Creating Resources group..."
  resource_group = project.main_group['Enclose'].new_group('Resources', 'Resources')
end

sounds.each do |sound|
  # Assume files are at Enclose/Resources/sound.mp3
  full_path = "Enclose/Resources/#{sound}"
  
  if File.exist?(full_path)
    puts "Adding #{sound}..."
    # Check if already in project to avoid dups
    existing = resource_group.files.find { |f| f.path == sound }
    unless existing
      file_ref = resource_group.new_reference(sound)
      target.add_resources([file_ref])
    else 
      puts "Already referenced."
    end
  else
    puts "WARNING: #{sound} not found on disk at #{full_path}"
  end
end

project.save
puts "Project saved."
