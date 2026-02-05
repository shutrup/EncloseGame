require 'xcodeproj'
project = Xcodeproj::Project.open('Enclose.xcodeproj')
puts "Main Group Class: #{project.main_group.class}"
puts "Main Group Name: #{project.main_group.name}"
puts "Main Group Path: #{project.main_group.path}"
# Try to iterate children if possible
if project.main_group.respond_to?(:children)
  project.main_group.children.each do |child|
    puts "Child: #{child.display_name} (#{child.class})"
  end
else
  puts "Main group does not respond to children"
end
