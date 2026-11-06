document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Failed to load activities (${response.status})`);
      }
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      while (activitySelect.options.length > 1) {
        activitySelect.remove(1);
      }

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        const title = document.createElement("h4");
        title.textContent = name;

        const description = document.createElement("p");
        description.className = "activity-description";
        description.textContent = details.description;

        const schedule = document.createElement("p");
        const scheduleLabel = document.createElement("strong");
        scheduleLabel.textContent = "Schedule: ";
        schedule.append(scheduleLabel, details.schedule);

        const availability = document.createElement("p");
        availability.className = "activity-availability";
        const availabilityLabel = document.createElement("strong");
        availabilityLabel.textContent = "Availability: ";
        availability.append(
          availabilityLabel,
          `${spotsLeft} spots left`
        );

        const participantsSection = document.createElement("div");
        participantsSection.className = "participants-section";

        const participantsHeading = document.createElement("h5");
        participantsHeading.textContent = "Participants";

        const participantCount = document.createElement("span");
        participantCount.className = "participant-count";
        participantCount.textContent = details.participants.length;
        participantsHeading.appendChild(participantCount);

        participantsSection.appendChild(participantsHeading);
        if (details.participants.length) {
          const participantList = document.createElement("ul");
          participantList.className = "participant-list";

          details.participants.forEach((email) => {
            const participant = document.createElement("li");
            participant.className = "participant-item";

            const participantEmail = document.createElement("span");
            participantEmail.textContent = email;

            const removeButton = document.createElement("button");
            removeButton.className = "participant-remove";
            removeButton.type = "button";
            removeButton.setAttribute("aria-label", `Unregister ${email} from ${name}`);
            removeButton.title = "Unregister participant";
            removeButton.innerHTML = `
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m5 4v6m4-6v6" />
              </svg>
            `;
            removeButton.addEventListener("click", async () => {
              try {
                const response = await fetch(
                  `/activities/${encodeURIComponent(name)}/signup?email=${encodeURIComponent(email)}`,
                  { method: "DELETE" }
                );
                const result = await response.json();

                if (!response.ok) {
                  throw new Error(result.detail || "Unable to unregister participant");
                }

                messageDiv.textContent = result.message;
                messageDiv.className = "success";
                messageDiv.classList.remove("hidden");
                await fetchActivities();
              } catch (error) {
                messageDiv.textContent =
                  error instanceof Error ? error.message : "Failed to unregister participant.";
                messageDiv.className = "error";
                messageDiv.classList.remove("hidden");
                console.error("Error unregistering participant:", error);
              }
            });

            participant.append(participantEmail, removeButton);
            participantList.appendChild(participant);
          });

          participantsSection.appendChild(participantList);
        } else {
          const emptyMessage = document.createElement("p");
          emptyMessage.className = "empty-participants";
          emptyMessage.textContent = "No participants yet";
          participantsSection.appendChild(emptyMessage);
        }

        activityCard.append(
          title,
          description,
          schedule,
          availability,
          participantsSection
        );

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
