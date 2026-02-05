require 'xcodeproj'

project = Xcodeproj::Project.open('Enclose.xcodeproj')
target = project.targets.first
resources_phase = target.resources_build_phase

sound_files = ['pop.mp3', 'capture.mp3', 'win.mp3', 'loss.mp3']

found_in_project = resources_phase.files.map { |f| f.file_ref.display_name }
puts "Files in Resources Build Phase:"
puts found_in_project

sound_files.each do |sound|
  if found_in_project.include?(sound)
    puts "#{sound}: FOUND"
  else
    puts "#{sound}: MISSING in project"
  end
end
