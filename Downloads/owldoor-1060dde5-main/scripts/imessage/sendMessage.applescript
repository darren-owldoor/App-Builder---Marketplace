#!/usr/bin/osascript

-- OwlDoor iMessage Sender Script
-- Usage: osascript sendMessage.applescript "+15555551234" "Your message here"

on run argv
	if (count of argv) < 2 then
		return "Error: Missing arguments. Usage: sendMessage.applescript <phone> <message>"
	end if
	
	set phoneNumber to item 1 of argv
	set messageText to item 2 of argv
	
	try
		tell application "Messages"
			-- Ensure Messages app is running
			if not (exists service 1) then
				return "Error: iMessage is not set up or signed in"
			end if
			
			-- Find or create buddy for this phone number
			set targetBuddy to null
			set targetService to 1st service whose service type = iMessage
			
			repeat with aBuddy in (buddies of targetService)
				if handle of aBuddy = phoneNumber then
					set targetBuddy to aBuddy
					exit repeat
				end if
			end repeat
			
			-- If buddy doesn't exist, create new conversation
			if targetBuddy is null then
				set targetBuddy to buddy phoneNumber of targetService
			end if
			
			-- Send the message
			send messageText to targetBuddy
			
			return "Success: Message sent to " & phoneNumber
		end tell
		
	on error errMsg
		return "Error: " & errMsg
	end try
end run
