### **Product Requirements Document: Automated Dispatch Location and Printing System (v1.3)**

**1. Introduction**
This document outlines the product requirements for an automated system designed to streamline the dispatch process for a fire department. The system will automatically process incoming dispatch emails, extract GPS coordinates, generate a route map from a predefined starting point, and print the combined information. The primary goal is to provide fire department personnel with immediate, clear, and reliable visual information for emergency response, eliminating the need for manual data entry and map plotting.

**2. Vision and Goals**
The vision is to create a "zero-touch" system that accelerates the dispatch-to-en-route time for fire crews. The primary pain point being addressed is the potential loss of signal en route; a pre-printed map ensures navigational continuity. By automating the extraction and visualization of location information, we can reduce human error and provide critical information in a quickly digestible format.

*   **Automation:** Fully automate the process from receiving a dispatch email to printing a route map.
*   **Clarity:** Provide a clear, legible printed output combining dispatch information with a visual map or a clear error message.
*   **Reliability:** Build a robust system that handles failures gracefully and provides clear recovery paths.
*   **Ease of Use:** Create a system that requires no technical expertise for daily operation and features a simple administrative interface.

**3. User Personas**
*   **Firefighter/First Responder:** The primary user. They are not tech-savvy and require the printed output to be highly legible under stressful conditions, featuring large fonts for critical data and a high-contrast map.
*   **Dispatch Administrator:** A user with basic computer skills responsible for system oversight. Their primary goal is to ensure every dispatch is processed correctly. They need to quickly identify and resolve failures via a simple admin panel.

**4. Features**

**4.1. Automated Email Processing**
*   **Email Monitoring:** The system must continuously monitor a specified email inbox for new messages.
*   **Email Filtering:** The system will process emails based on a configurable rule set:
    *   Emails must match either a "sender's email address" or a "subject contains" rule.
    *   An advanced, mutually exclusive option for "subject matches regex" will be available.
    *   **Rule Logic:** If both a sender address and a subject rule are configured, the system will only process emails that match **both** conditions (logical AND).
*   **GPS Data Extraction:**
    *   The system must parse the email to find GPS coordinates strictly in the Decimal Degrees format (e.g., `49.947014 N, 17.885027 E`).
    *   **Multiple Coordinates Handling:** If multiple sets of GPS coordinates are found, the system will use the **first** set found to generate the map. A warning message, "Multiple GPS locations found; please verify," must be included on the printed output and in the admin panel log for that email.
*   **Email Content Preservation:** The original HTML content of the email must be preserved without any modification. All new content (map, errors, warnings) will be appended.

**4.2. Route Visualization and Output Generation**
*   **Static Map Generation:** Upon successful extraction of GPS coordinates, the system will make an API request to a configured mapping service. The request will use a predefined starting point (from the station's configuration) and the extracted target coordinates.
*   **Final Document Assembly:** The system will generate a final HTML document for printing. The retrieved map image (or an error message) will be appended to the end of the original email's HTML content.
*   **Layout:** The appended content must be visually separated from the original email by a horizontal line and sufficient padding to create a distinct section.

**4.3. Automated Printing**
*   **CUPS Integration:** The system will automatically send the final combined HTML document to a configured CUPS server for printing.
*   **Configurable Print Formatting:** The admin panel will provide a setting for print layout:
    *   **Single-Page:** The original email and the appended map/error are combined on a single page.
    *   **Two-Page:** The original email prints on the first page, and the appended map/error prints on a separate second page.

**4.4. Admin Panel**
*   **Dashboard Overview:** A web-based administrative panel must provide an at-a-glance overview of the system's status, including:
    *   Total emails processed in the last 24 hours.
    *   A count of successful vs. failed jobs.
    *   A real-time status indicator for key services (Email, Mapping Service, CUPS).
*   **Processed Email Log:** The panel will display a paginated log of all processed emails (50 items per page), with the following columns:
    *   **Status:** A color-coded indicator (e.g., Green for Success, Red for Failed).
    *   **Subject:** The subject line of the original email.
    *   **Date Received:** Timestamp of when the email was received.
    *   **Date Printed:** Timestamp of the last successful print attempt.
    *   **Error:** A human-readable error message, if any.
    *   **Actions:** Buttons to "Preview" the final printed output and, for failed jobs, a "Retry" button.
*   **Email Preview:** Admins must be able to view the original, unmodified email content to diagnose parsing failures.
*   **Manual Retry:** The "Retry" button on a failed job will trigger the processing and printing sequence again for that specific email.
*   **Configuration:** A secure, password-protected section will allow an authorized user to configure:
    *   Email address to monitor and its credentials.
    *   Filtering rules ("sender address," "subject contains," and "subject regex").
    *   The predefined starting point (the station's address or GPS).
    *   The address and port of the CUPS server.
    *   The printing format (Single-Page or Two-Page).
    *   The API key for the mapping service.

**5. Non-Functional Requirements**
*   **Error Handling:**
    *   **Human-Readable Errors:** All error messages intended for the printed output or the admin panel must be clear and non-technical. Examples: "Map could not be generated: Mapping service is unavailable," "Printing failed: Printer is unreachable."
    *   **Specific Failure Scenarios:** The system must gracefully handle and log failures from:
        *   **GPS Not Found:** The original email is printed with an appended error message.
        *   **Mapping Service Failure (API down, invalid key, timeout):** The original email is printed with an appended error message.
        *   **CUPS Server Failure (unreachable, printer error):** The job is marked as failed in the admin panel.
    *   **Automated Retries:** For printing failures (e.g., CUPS server unreachable), the system must automatically attempt to retry the print job **3 times** with a **30-second** delay between each attempt. If all retries fail, the job is marked as "Failed" and requires manual intervention.
*   **Security:**
    *   The admin panel must be password-protected.
    *   All secrets (email credentials, API keys) must be stored securely and not in plain text. The storage mechanism must be appropriate for a system deployed on a private local network.
*   **Usability:**
    *   The admin panel must be intuitive for non-technical users.
    *   The admin panel must feature a **responsive layout** and be fully functional on both desktop and mobile web browsers.

**6. System Requirements & Constraints**
*   The system must be deployable on a Linux-based server (e.g., Raspberry Pi).
*   The system requires stable network access to the designated email server (via SMTP/IMAP) and the CUPS server on their respective ports.
*   The system requires internet access to communicate with the chosen mapping service API.

**7. Assumptions and Dependencies**
*   The fire department has a stable internet connection and a functional CUPS server on their network.
*   A dedicated email account will be used for receiving dispatch notifications.

**8. Future Enhancements (Out of Scope for v1.3)**
*   Notifications (e.g., SMS, push notifications) to key personnel in case of processing failures.
*   Advanced text extraction from the email body to provide a more descriptive title in the admin panel log.