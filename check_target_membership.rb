require 'xcodeproj'
project = Xcodeproj::Project.open('Enclose.xcodeproj')
target = project.targets.first
file_name = 'SplashScreenView.swift'
params = target.source_build_phase.files.map { |f| f.file_ref.display_name }
if params.include?(file_name)
  puts "#{file_name} IS in compile sources."
else
  puts "#{file_name} is NOT in compile sources."
end
