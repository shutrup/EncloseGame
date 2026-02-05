require 'xcodeproj'

project_path = 'Enclose.xcodeproj'
project = Xcodeproj::Project.open(project_path)
target = project.targets.first

sounds = ['pop.wav', 'capture.wav', 'win.wav', 'loss.wav']
resource_group = project.main_group['Enclose']['Resources']

if resource_group.nil?
  puts "Creating Resources group..."
  resource_group = project.main_group['Enclose'].new_group('Resources', 'Resources')
end

sounds.each do |sound|
  full_path = "Enclose/Resources/#{sound}"
  
  if File.exist?(full_path)
    puts "Adding #{sound}..."
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
