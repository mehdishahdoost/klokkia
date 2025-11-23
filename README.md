# 🕐 Clockia - Dutch Clock Learning Game

An interactive 3D educational game to teach children how to read and tell time in Dutch, featuring both analog and digital clocks.

## 🎮 Features

- **3D World Exploration**: Navigate through a colorful 3D environment with trees and multiple clock stations
- **Clock Types**: Learn from both analog (classic) and digital clock displays
- **Dutch Time Practice**: Type the correct Dutch time format (e.g., "tien over acht", "kwart voor drie")
- **Interactive Gameplay**:
  - WASD or Arrow keys for movement
  - Approach clocks to trigger time challenges
  - Score points for correct answers
  - Get hints after 3 incorrect attempts
- **24-Hour System Introduction**: Animated intro showing sun/moon cycle to understand day/night
- **Progressive Learning**: Clocks regenerate with new times after successful answers

## 🚀 How to Run

### Option 1: Direct Browser Opening
Simply open the `index.html` file directly in your web browser:
```bash
# Navigate to the project directory
cd /home/wbh/workspace/projects/clockia

# Open in default browser (Linux)
xdg-open index.html

# Or simply drag and drop index.html into your browser
```

### Option 2: Using a Local Web Server (Recommended)
For better performance and to avoid any CORS issues:

```bash
# Using Python 3
python3 -m http.server 8000

# Or using Python 2
python -m SimpleHTTPServer 8000

# Then open in browser
# http://localhost:8000
```

### Option 3: Using Node.js
If you have Node.js installed:
```bash
# Install http-server globally
npm install -g http-server

# Run the server
http-server

# Open http://localhost:8080 in your browser
```

## 🎯 How to Play

1. **Start**: Click anywhere on the intro screen to watch the 24-hour animation
2. **Begin Game**: Click the "Start" button after the intro
3. **Move**: Use WASD or Arrow keys to move your character
4. **Find Clocks**: Walk close to any clock in the world
5. **Answer**: Type the Dutch time when prompted (e.g., "half drie", "kwart over vijf")
6. **Score Points**: Earn 10 points for each correct answer
7. **Learn**: If you're stuck, after 3 attempts the correct answer will be shown

## 📚 Dutch Time Format Examples

- **Full hours**: "drie uur" (3:00)
- **Quarter past**: "kwart over twee" (2:15)
- **Half past**: "half vier" (3:30) - Note: In Dutch, "half vier" means 3:30, not 4:30!
- **Quarter to**: "kwart voor vijf" (4:45)
- **Minutes past**: "tien over acht" (8:10)
- **Minutes to half**: "vijf voor half zeven" (6:25)
- **Minutes past half**: "vijf over half negen" (8:35)
- **Special times**: "middag" (12:00), "middernacht" (00:00)

## 🛠️ Technologies Used

- **Three.js**: 3D graphics and animations
- **HTML5**: Game structure
- **CSS3**: Styling and UI
- **Vanilla JavaScript**: Game logic and interactions

## 📝 Learning Objectives

- Understand the 24-hour clock system
- Learn to read analog clocks
- Learn to read digital clocks
- Master Dutch time expressions
- Develop spatial awareness through 3D navigation

## 🎨 Game Elements

- **Player**: Blue capsule character with simple face
- **Clocks**: Mix of analog and digital displays on poles
- **Environment**: Green grass field with decorative trees
- **Sky**: Dynamic sky that changes during intro animation
- **UI**: Score display, play/pause controls, input field for answers

## 🔧 Browser Compatibility

The game works best in modern browsers with WebGL support:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📱 Controls

| Key | Action |
|-----|--------|
| W / ↑ | Move forward |
| S / ↓ | Move backward |
| A / ← | Move left |
| D / → | Move right |
| Enter | Submit answer |

## 🌟 Tips for Success

1. Pay attention to the intro animation to understand how time progresses
2. Remember that "half" in Dutch refers to half *before* the hour
3. Start with the easier full hours and quarter times
4. Use the 3 attempts wisely - each wrong answer helps you learn
5. Practice makes perfect - the more you play, the better you'll get!

## 📄 License

Educational project for teaching Dutch time-telling to children.

---

**Have fun learning Dutch time with Clockia!** 🎉
