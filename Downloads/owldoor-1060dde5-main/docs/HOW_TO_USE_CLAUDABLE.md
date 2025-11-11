# How to Edit and Build with Claudable

This guide explains how to use Claudable's visual builder to create and edit pages, components, and admin experiences.

## Accessing Claudable

1. **Navigate to Admin Panel**: Go to `/admin?view=claudable` in your application
2. **Configure URL** (if not already done): Click "Configure URL" and enter your Vercel deployment URL
3. **The Builder Loads**: Claudable will load in an embedded iframe

## Understanding the Claudable Interface

When Claudable loads, you'll typically see:

### Main Areas:
- **Left Sidebar**: Component library, templates, and assets
- **Center Canvas**: Your page/component being edited
- **Right Sidebar**: Properties panel for selected elements
- **Top Toolbar**: Actions like save, preview, export

## Basic Editing Workflow

### 1. **Create a New Page/Component**
- Look for a "New Page" or "+" button in the Claudable interface
- Choose from templates or start blank
- Give your page a name

### 2. **Add Elements (Drag & Drop)**
- **Browse Components**: Look in the left sidebar for available components
- **Drag to Canvas**: Click and drag components onto your canvas
- **Common Components**:
  - Text blocks
  - Images
  - Buttons
  - Forms
  - Sections/Containers
  - Headers/Footers

### 3. **Edit Element Properties**
- **Select an Element**: Click on any element on the canvas
- **Properties Panel**: The right sidebar shows editable properties:
  - Text content
  - Colors (background, text, borders)
  - Font size, weight, alignment
  - Spacing (padding, margin)
  - Size and positioning
  - Links and actions

### 4. **Rearrange Elements**
- **Drag to Reorder**: Drag elements up/down to change order
- **Move Between Containers**: Drag elements into different sections
- **Delete**: Select element and press Delete key or use delete button

### 5. **Responsive Design**
- **Device Preview**: Switch between desktop, tablet, mobile views
- **Responsive Settings**: Adjust how elements behave on different screen sizes

## Advanced Features

### **Styling & Customization**
- **Custom CSS**: Some versions allow custom CSS injection
- **Theme Settings**: Global color schemes, fonts
- **Component Styles**: Save styles as reusable presets

### **Interactions & Actions**
- **Button Actions**: Set what happens when buttons are clicked
- **Form Handling**: Configure form submissions
- **Links**: Internal links, external URLs, anchors

### **Preview & Testing**
- **Live Preview**: See changes in real-time
- **Device Testing**: Preview on different screen sizes
- **Interaction Testing**: Test buttons, forms, links

## Saving & Exporting Your Work

### **Save in Claudable**
- **Save Button**: Look for save icon in toolbar
- **Auto-save**: Some versions auto-save as you work
- **Version History**: May have undo/redo or version history

### **Export Options** (when ready to use in your app)
- **Export Code**: Get HTML/CSS/JS code
- **Copy Components**: Copy specific sections
- **Export as Template**: Save as reusable template

## Integration with Your App

### **Using Claudable Designs in Your App**

1. **Export Code**: 
   - Design in Claudable
   - Export the code
   - Copy into your React components

2. **Component Library**:
   - Build reusable components in Claudable
   - Export and add to your component library
   - Import where needed

3. **Page Templates**:
   - Create full page designs
   - Export and create new pages in your app
   - Customize further in code if needed

## Tips for Effective Editing

### **Start with Templates**
- Use pre-built templates as starting points
- Faster than building from scratch
- Customize to match your brand

### **Component Reusability**
- Build reusable components
- Save frequently used sections
- Create a component library

### **Design System Consistency**
- Use consistent colors, fonts, spacing
- Create style presets
- Follow your brand guidelines

### **Mobile-First Approach**
- Design for mobile first
- Then enhance for desktop
- Test on actual devices when possible

## Common Use Cases

### **1. Admin Dashboard Pages**
- Create custom admin pages
- Design data tables, forms, charts
- Export and integrate with your admin routes

### **2. Marketing Landing Pages**
- Build landing pages quickly
- A/B test different designs
- Export and deploy

### **3. Form Builders**
- Create custom forms
- Configure validation
- Set up submission handling

### **4. Component Prototyping**
- Prototype new components visually
- Get code to implement properly
- Iterate quickly

## Troubleshooting

### **If Claudable Won't Load**
- Check your URL configuration
- Ensure `?embed=1` is in the URL
- Check browser console for errors
- Verify CORS settings on your Claudable deployment

### **If Changes Don't Save**
- Check if you're logged into Claudable
- Look for save button/indicator
- Check browser console for errors

### **If Export Doesn't Work**
- Ensure you're using a supported export format
- Check Claudable version/features
- Try copying code manually if needed

## Next Steps

1. **Explore Templates**: Start by browsing available templates
2. **Create a Test Page**: Build something simple to learn the interface
3. **Export and Integrate**: Once comfortable, export and use in your app
4. **Build Component Library**: Create reusable components over time

## Resources

- **Claudable GitHub**: [https://github.com/opactorai/Claudable](https://github.com/opactorai/Claudable)
- **Claudable Docs**: Check the GitHub README for detailed documentation
- **Your Vercel Deployment**: Your deployed instance may have additional docs

---

**Note**: The exact interface may vary depending on your Claudable version. If you see different options than described, explore the interface - most visual builders follow similar patterns!

