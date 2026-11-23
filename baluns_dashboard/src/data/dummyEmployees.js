const FIRST_NAMES = [
    "Arun", "Meena", "Sathish", "Ravi", "Karthik",
    "Nisha", "Priya", "Dinesh", "Divya", "Rahul",
    "Sanjay", "Anitha", "Deepak", "Keerthana",
    "Vignesh", "Harini", "Praveen", "Swetha",
    "Manoj", "Pavithra", "Ajith", "Gayathri",
    "Naveen", "Ramya", "Surya",
  ];
  
  const LAST_NAMES = ["K", "R", "S", "M"];
  
  const ROLES = [
    "Frontend Developer",
    "Backend Developer",
    "Software Engineer",
    "QA Engineer",
    "Business Analyst",
    "Application Developer",
    "Team Lead",
    "UI/UX Designer",
    "Support Engineer",
    "Project Coordinator",
  ];
  
  // Fallback teams for demo
  const DEFAULT_TEAMS = [
    { id: "software", name: "Software" },
    { id: "application", name: "Application" },
    { id: "business", name: "Business" },
  ];
  
  export function generateDummyEmployees(boards = []) {
    const validBoards = (Array.isArray(boards) ? boards : [])
      .filter((board) => board?.id && board?.name?.trim());
  
    const teams = validBoards.length
      ? validBoards
      : DEFAULT_TEAMS;
  
    return Array.from({ length: 100 }, (_, index) => {
      const board = teams[index % teams.length];
  
      const firstName = FIRST_NAMES[index % FIRST_NAMES.length];
  
      const lastName =
        LAST_NAMES[
          Math.floor(index / FIRST_NAMES.length) %
            LAST_NAMES.length
        ];
  
      return {
        id: `EMP${String(index + 1).padStart(3, "0")}`,
        empId: `EMP${String(index + 1).padStart(3, "0")}`,
        name: `${firstName} ${lastName}`,
        role: ROLES[index % ROLES.length],
        team: board.name,
        teamId: board.id,
      };
    });
  }