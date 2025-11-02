# Edit Visual Photo Modal Component

## Overview

The `edit-visual-photo-modal` is a reusable web component that allows users to edit visual photos and their associated descriptions. It follows the same design patterns as other modals in the CSWDO system and includes confirmation and success modals.

## Features

- **Modal Design**: Follows the same design pattern as `add-service-modal` with orange theme and CSWDO branding
- **Image Upload**: Supports image file upload with validation (JPG, PNG, GIF, max 5MB)
- **Image Preview**: Shows current image and previews newly selected images
- **Content Editing**: Textarea for editing visual content descriptions
- **Confirmation Modal**: Shows "sure-to-save" modal before saving changes
- **Success Modal**: Shows success message after successful update
- **Reusable**: Can be used by any JS component with different query identifiers
- **PHP Integration**: Integrates with `visualPictures.php` backend for data persistence

## File Structure

```
components/admin/modals/
├── edit-visual-photo.js          # Main modal component
└── confirmationmodals/
    ├── sure-to-save-modal.js     # Confirmation modal
    └── success-save-modal.js     # Success modal

php_folder/
└── visualPictures.php            # Backend API for visual data

uploads/
└── visual_pictures/              # Directory for uploaded images
```

## Usage

### Basic Usage

```javascript
// Create and show the modal
const modal = document.createElement("edit-visual-photo-modal");

// Listen for updates
modal.addEventListener("visual-photo-updated", (e) => {
  const { data, query, sourceComponent } = e.detail;
  console.log("Visual photo updated:", data);
});

document.body.appendChild(modal);

// Set data for the modal
modal.setData(this, currentData, "uniqueQueryIdentifier");
```

### Complete Example

```javascript
class MyComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  setupEventListeners() {
    const editBtn = this.shadowRoot.querySelector("#editBtn");
    editBtn.addEventListener("click", () => this.showEditModal());
  }

  async showEditModal() {
    const modal = document.createElement("edit-visual-photo-modal");
    
    // Listen for visual photo updates
    modal.addEventListener("visual-photo-updated", (e) => {
      this.handleVisualPhotoUpdate(e.detail);
    });
    
    document.body.appendChild(modal);
    
    // Set current data and query identifier
    const currentData = {
      visualPhoto: this.shadowRoot.querySelector("#currentImage")?.src,
      visualContent: this.shadowRoot.querySelector("#currentContent")?.textContent?.trim()
    };
    
    modal.setData(this, currentData, "myComponent");
  }

  handleVisualPhotoUpdate(detail) {
    const { data, query, sourceComponent } = detail;
    
    if (query === "myComponent") {
      // Update the component with new data
      const imageElement = this.shadowRoot.querySelector("#currentImage");
      const contentElement = this.shadowRoot.querySelector("#currentContent");
      
      if (data.visualPhoto && imageElement) {
        imageElement.src = data.visualPhoto;
      }
      
      if (data.visualContent && contentElement) {
        contentElement.textContent = data.visualContent;
      }
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <div>
        <img id="currentImage" src="./imgs/default.png" alt="Current Image">
        <div id="currentContent">Current description</div>
        <button id="editBtn">Edit Visual Photo</button>
      </div>
    `;
  }
}
```

## API Reference

### Modal Methods

#### `setData(sourceComponent, data, query)`
Sets the data for the modal.

- **sourceComponent**: The component that created the modal (can be null)
- **data**: Object containing current visual data
  - `visualPhoto`: URL or path to current image
  - `visualContent`: Current description text
- **query**: Unique identifier for this visual data (used for database storage)

#### `fetchVisualData(query)`
Fetches visual data from the PHP backend.

- **query**: The query identifier to fetch data for
- **Returns**: Promise that resolves to visual data object

### Events

#### `visual-photo-updated`
Dispatched when visual photo is successfully updated.

**Event Detail:**
```javascript
{
  data: {
    visualPhoto: "path/to/image.jpg",
    visualContent: "Updated description"
  },
  query: "uniqueQueryIdentifier",
  sourceComponent: componentReference
}
```

## Backend Integration

### Database Schema

The component creates a `visual_pictures` table with the following structure:

```sql
CREATE TABLE visual_pictures (
  id INT AUTO_INCREMENT PRIMARY KEY,
  query_key VARCHAR(255) NOT NULL,
  visual_photo VARCHAR(500),
  visual_content TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_query (query_key)
);
```

### PHP API Endpoints

#### GET Visual Data
```javascript
POST ./php_folder/visualPictures.php
{
  "action": "getVisualData",
  "query": "uniqueQueryIdentifier"
}
```

#### UPDATE Visual Data
```javascript
POST ./php_folder/visualPictures.php
FormData:
- action: "updateVisualData"
- visualContent: "Updated description"
- query: "uniqueQueryIdentifier"
- visualPhoto: [file] (optional)
```

## Styling

The modal uses the same styling as other CSWDO modals:

- **Colors**: Orange theme (#ea580c)
- **Background**: White with CSWDO logo watermark
- **Borders**: Orange borders on form elements
- **Buttons**: Orange primary buttons, gray secondary buttons
- **Responsive**: Adapts to different screen sizes

## Validation

- **File Type**: Only JPG, PNG, and GIF images allowed
- **File Size**: Maximum 5MB per image
- **Content**: Visual content description is required
- **Image Preview**: Shows current image and previews new selections

## Error Handling

- **Network Errors**: Shows error messages for connection issues
- **File Validation**: Validates file type and size before upload
- **Server Errors**: Displays server error messages
- **Form Validation**: Validates required fields before submission

## Integration Examples

### In manage-services.js
```javascript
editHeaderContent() {
  this.showEditVisualPhotoModal();
}

async showEditVisualPhotoModal() {
  const modal = document.createElement("edit-visual-photo-modal");
  
  modal.addEventListener("visual-photo-updated", (e) => {
    this.updateVisualPhoto(e.detail);
  });
  
  document.body.appendChild(modal);
  
  const currentData = {
    visualPhoto: this.shadowRoot.querySelector("#servicesHeaderImage")?.src,
    visualContent: this.shadowRoot.querySelector("#servicesHeaderContent")?.textContent?.trim()
  };
  
  modal.setData(this, currentData, "servicesHeader");
}
```

### In other components
```javascript
// For home page
modal.setData(this, currentData, "homePage");

// For about page
modal.setData(this, currentData, "aboutPage");

// For services page
modal.setData(this, currentData, "servicesPage");
```

## Dependencies

- Bootstrap 5.3.2 CSS
- Custom confirmation modals (`sure-to-save-modal`, `success-save-modal`)
- PHP backend with database connection
- File upload directory (`uploads/visual_pictures/`)

## Browser Support

- Modern browsers with ES6+ support
- File API support for image uploads
- Shadow DOM support for web components
