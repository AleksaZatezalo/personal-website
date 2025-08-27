import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import MatrixNavbar from '../MatrixNavbar';
// Import a dark theme that works well with Matrix aesthetic
import 'highlight.js/styles/atom-one-dark.css';

// Embedded markdown content
const EMBEDDED_POSTS = {
  'welcome-to-defcon-belgrade.md': `
# Welcome to DefCon Belgrade

Welcome to our cybersecurity community! We're excited to share knowledge, research, and insights with the security community.

## What We Cover

- **Vulnerability Research**: Latest CVE discoveries
- **Penetration Testing**: Real-world techniques and tools  
- **Security News**: Industry updates and analysis

## Join Our Community

It does not matter if you are a computer hacker, a programer, a lawyer or business owner. Everyone with an interest in security is free to attend. We accept lurkers, form posters, event attendees, and speakers so long as you engage with the community.`,

  'what-are-defcon-groups.md': `# What Are DEFCON Groups?

## Overview

DEFCON Groups are local chapters of security enthusiasts, hackers, and cybersecurity professionals that meet regularly around the world. These groups serve as year-round extensions of the famous DEFCON hacker conference, fostering local communities of learning, networking, and knowledge sharing.

## The DEFCON Hacker Conference

DEFCON is one of the world's largest and most influential hacker conventions, held annually in Las Vegas since 1993. Founded by Jeff Moss (Dark Tangent), DEFCON brings together:

- Security researchers and professionals
- Hackers and enthusiasts
- Government personnel
- Students and academics
- Industry professionals

The conference features:
- Technical presentations and workshops
- Capture The Flag (CTF) competitions
- Villages focused on specific topics (IoT, lockpicking, social engineering, etc.)
- Networking opportunities
- Hands-on learning experiences

## DEFCON Group Naming Convention

DEFCON Groups follow a unique naming convention rooted in telecommunications history:

### The Phreaking Connection

The naming system is based on **area codes**, which traces back to the historical connection between hacking and **phreaking** (phone hacking). In the early days of hacking culture:

- Phone systems were among the first networks hackers explored
- "Phone phreaks" discovered ways to manipulate telephone networks
- Area codes became symbolic identifiers within the community
- This tradition carried forward into modern hacker culture

### Example: DC381 (Serbia)

**DC381** represents the DEFCON Group for Serbia:
- **DC** = DEFCON
- **381** = Serbia's country calling code
- This follows the pattern while adapting to international contexts

Other examples:
- DC505 (Albuquerque, New Mexico - area code 505)
- DC214 (Dallas, Texas - area code 214)
- DC44 (London, UK - country code 44)

## Purpose and Activities

DEFCON Groups typically organize:
- Monthly or bi-weekly meetings
- Technical presentations and talks
- Hands-on workshops and training
- Local CTF competitions
- Social networking events
- Community outreach and education

These groups maintain the DEFCON spirit of open learning, curiosity, and ethical hacking throughout the year, making cybersecurity knowledge accessible to local communities worldwide.`,

  'computer-hacking-101.md': `# Computer Hacking 101

## Introduction

Computer hacking is the practice of exploring, understanding, and manipulating computer systems and networks. Contrary to popular media portrayals, hacking is not inherently illegal or malicious—it's fundamentally about curiosity, problem-solving, and pushing the boundaries of what's possible with technology.

## Legal and Ethical Context

### Hacking Is Not Always Illegal

The legality of hacking depends entirely on **authorization and intent**:

**Legal Hacking:**
- Penetration testing with proper authorization
- Bug bounty programs
- Security research on your own systems
- Educational environments and labs
- Open source security auditing

**Illegal Hacking:**
- Unauthorized access to systems
- Data theft or destruction
- Fraud or financial crimes
- Privacy violations
- Disrupting services without permission

## Key Hacking Concepts

### Initial Access

**Initial Access** refers to the first step in gaining entry to a target system or network:

- **Attack Vectors:** Email phishing, vulnerable web applications, USB drops, social engineering
- **Exploitation:** Taking advantage of software vulnerabilities, misconfigurations, or human error
- **Persistence:** Establishing a foothold that survives reboots and basic cleanup attempts
- **Examples:** Exploiting an unpatched server, successful phishing campaign, physical access via tailgating

### Privilege Escalation

**Privilege Escalation** is the process of gaining higher-level permissions within a system:

**Vertical Escalation:**
- Moving from user-level to administrator/root access
- Exploiting system vulnerabilities or misconfigurations
- Taking advantage of poorly configured services

**Horizontal Escalation:**
- Moving between accounts at the same privilege level
- Accessing different user accounts or resources
- Lateral movement across network segments

**Common Techniques:**
- Exploiting SUID/SGID binaries on Unix systems
- Windows privilege escalation via service misconfigurations
- Kernel exploits for direct system-level access
- Credential harvesting and password attacks

## Historical Foundation: The MIT Tech Model Railroad Club

### The Birth of Hacker Culture

The modern concept of "hacking" originated at MIT in the late 1950s and early 1960s, specifically within the **Tech Model Railroad Club (TMRC)**:

**Key Contributions:**
- **Terminology:** The word "hack" originally meant an elegant, clever solution to a technical problem
- **Philosophy:** Emphasis on understanding systems deeply, not just using them
- **Curiosity-Driven:** Focus on learning how things work and making them work better
- **Sharing Knowledge:** Open collaboration and information exchange

**The Original Hackers:**
- Built and modified model railroad control systems
- Developed early programming techniques
- Created the foundation for what became personal computing
- Established the ethical framework that guides modern hacker culture

**Core Values Established:**
- Information wants to be free
- Access to computers should be unlimited and total
- Mistrust authority and promote decentralization
- Judge hackers by their skills, not credentials

## Red Team vs Blue Team

### Defense and Offense in Cybersecurity

The cybersecurity field is often structured around two primary roles that simulate real-world conflict:

### Blue Team (Defense)

**Role:** Protect and defend organizational systems

**Responsibilities:**
- Monitor networks and systems for threats
- Implement security controls and policies
- Incident response and forensic analysis
- Security architecture and hardening
- Compliance and risk management

**Tools and Techniques:**
- SIEM (Security Information and Event Management)
- Intrusion Detection Systems (IDS)
- Log analysis and correlation
- Threat hunting and monitoring
- Security awareness training

### Red Team (Offense)

**Role:** Simulate real-world attacks to test defenses

**Responsibilities:**
- Penetration testing and vulnerability assessment
- Social engineering campaigns
- Physical security testing
- Adversary simulation exercises
- Security control validation

**Tools and Techniques:**
- Exploitation frameworks (Metasploit, Cobalt Strike)
- Reconnaissance and intelligence gathering
- Custom payload development
- Post-exploitation and persistence
- Steganography and evasion techniques

### Purple Team (Collaboration)

**Emerging Concept:** Purple teams bridge the gap between red and blue teams:
- Joint exercises and knowledge sharing
- Collaborative threat modeling
- Defensive measure effectiveness testing
- Continuous improvement through feedback loops

## Conclusion

Computer hacking, when approached ethically and legally, serves as a crucial component of modern cybersecurity. Understanding these foundational concepts, historical context, and the collaborative defensive framework helps build a solid foundation for anyone interested in cybersecurity, whether pursuing defensive (blue team) or offensive (red team) specializations.`,

  'getting-connected.md': `# Getting Connected

## Join Our Community

Now that you've read through the introductory articles about DEFCON groups and computer hacking fundamentals, it's time to connect with our local community and start your hands-on cybersecurity journey.

## Getting Access to Our Platform

### Creating Your Profile

To access our internal community resources, you'll need to create a profile on our platform:

1. **Navigate to the Sign-In Page:** Visit our community portal's sign-in page
2. **Create Your Account:** Click on the registration/sign-up option
3. **Complete Your Profile:** Fill out your basic information and interests

## What You'll Find on Our Platform

Once you've successfully registered with the access code, you'll gain access to:

### Meetup Schedule and Events

**Regular Meetings:**
- Monthly technical presentations and workshops
- Bi-weekly social networking sessions
- Special guest speaker events
- Hands-on lab sessions and CTF practice

**Event Information:**
- Detailed agendas and presentation topics
- Location details and directions
- Prerequisites and preparation materials
- Post-event resources and follow-up materials

**RSVP and Planning:**
- Event registration and capacity tracking
- Carpooling coordination for remote events
- Equipment needs and what to bring
- Difficulty levels and recommended experience

**Communication Guidelines:**
- Respectful and inclusive environment
- No illegal activities discussion
- Help others learn and grow
- Share knowledge freely but responsibly

### Internal Research and Resources

**Community Research Projects:**
- Collaborative vulnerability research
- Local infrastructure security assessments
- Open source tool development
- Educational content creation

**Shared Resources:**
- **Lab Environment Access:** Practice systems and vulnerable applications
- **Tool Library:** Community-maintained security tools and scripts
- **Documentation Wiki:** Tutorials, guides, and best practices
- **Reading Lists:** Recommended books, papers, and articles

**Knowledge Base:**
- Meeting notes and presentation archives
- Technical writeups from community members
- CTF challenge solutions and walkthroughs
- Local company and organization security profiles

## Community Guidelines and Culture

### Expected Behavior
- **Learn Actively:** Come with questions and curiosity
- **Share Knowledge:** Help others when you can
- **Respect Boundaries:** Understand legal and ethical limits
- **Collaborate:** Work together on projects and challenges

### Code of Conduct
- Harassment and discrimination are not tolerated
- Respect intellectual property and responsible disclosure
- No discussion of illegal activities or unethical hacking
- Maintain confidentiality of sensitive community information

## Getting the Most from Our Community

### For New Members
1. **Introduce Yourself:** Share your background and interests in the general channel
2. **Attend Your First Meeting:** Come to the next scheduled event
3. **Ask Questions:** Use the beginner's corner for basic queries
4. **Find a Mentor:** Connect with experienced members willing to guide you

### Building Your Skills
1. **Regular Participation:** Attend meetings and engage in online discussions
2. **Hands-On Practice:** Use our lab environments and practice challenges
3. **Collaborate on Projects:** Join or start research initiatives with other members
4. **Present and Teach:** Share your learning by presenting topics to the group

### Contributing Back
1. **Document Your Learning:** Write tutorials or guides for others
2. **Mentor Newcomers:** Help integrate new members into the community
3. **Organize Events:** Volunteer to help coordinate meetings and activities
4. **Share Resources:** Contribute tools, techniques, or research to the knowledge base

## Next Steps After Registration

### Immediate Actions (First Week)
1. **Complete Your Profile:** Add your interests and experience level
2. **Join Core Channels:** Connect to general discussion and events planning
3. **Review the Calendar:** Check upcoming meetings and mark your calendar
4. **Introduce Yourself:** Post a brief introduction in the newcomers section

### First Month Goals
1. **Attend Two Events:** One technical session and one social gathering
2. **Complete a Lab Challenge:** Try your first hands-on exercise
3. **Make Three Connections:** Network with other community members
4. **Contribute Once:** Share a resource, ask a thoughtful question, or help someone

### Ongoing Engagement
1. **Regular Meeting Attendance:** Become a familiar face in the community
2. **Skill Development:** Continuously learn through community resources
3. **Knowledge Sharing:** Regularly contribute to discussions and projects
4. **Community Growth:** Help recruit and integrate new members

## Conclusion

By using the access code **1337** to register, you're taking the first step into our cybersecurity community. Our platform provides everything you need to learn, connect, and grow within the field of cybersecurity.`,

  'attending-your-first-meetup.md': `# Attending Your First Meetup

## The Essence of DEFCON Groups: In-Person Connection

DEFCON Groups exist primarily for **in-person meetups**. While online platforms and digital resources are valuable supplements, the heart and soul of any DEFCON Group is the face-to-face gathering where real connections are made, knowledge is shared organically, and the hacker community spirit thrives.

## Keep It Simple: Just Show Up

### The Most Important Step

**Just show up and say hi.** That's it. No complicated preparation, no extensive research, no perfect introduction planned. The cybersecurity community values authenticity over polish, and curiosity over credentials.

### Finding Your First Event

1. Check the meetup schedule on our platform
2. Note the time, date, and location
3. Mark your calendar
4. Show up

## Setting the Right Expectations

### What NOT to Expect

**No Performance Pressure:**
- You don't need to demonstrate expertise
- No one expects you to contribute technical insights immediately
- There's no test or evaluation of your skills
- You won't be put on the spot or asked to prove yourself

**No Formal Structure:**
- These aren't corporate networking events with rigid protocols
- No need for business cards or elevator pitches
- Conversations flow naturally around shared interests
- Learning happens through casual discussion, not formal presentations

### What TO Expect

**Welcoming Environment:**
- Most attendees remember being newcomers themselves
- The community generally embraces the "pay it forward" mentality
- Questions are encouraged, not judged
- Diverse experience levels in the same room

**Organic Learning:**
- Knowledge sharing happens through natural conversation
- Stories and experiences are shared freely
- Problem-solving discussions emerge spontaneously
- Mentorship relationships develop naturally

## The Power of Attitude

### Bring Your Best Self

**Good Attitude Essentials:**
- **Curiosity:** Come ready to learn from everyone you meet
- **Openness:** Be receptive to new ideas and perspectives
- **Humility:** Everyone knows something you don't, regardless of their apparent experience level
- **Enthusiasm:** Genuine interest in cybersecurity and the community

### Mindset for Success

**Focus on Connection, Not Transaction:**
- Prioritize building relationships over immediate gains
- Listen more than you speak, especially initially
- Ask genuine questions about others' experiences
- Share your own journey and interests honestly

**Embrace the Learning Opportunity:**
- Every conversation is a chance to learn something new
- Mistakes and admissions of ignorance are learning opportunities
- The goal is growth, not appearing knowledgeable

## Practical Preparation

### Essential Equipment

**Bring Your PC:**
It's **strongly encouraged** to bring your personal computer because:

**Hands-On Demonstrations:**
- Live demos of tools and techniques often happen spontaneously
- You can follow along with tutorials and workshops
- Speakers may share resources or tools to try immediately
- Collaborative troubleshooting sessions occur naturally

**Interactive Participation:**
- CTF challenges or mini-competitions might emerge
- You can take notes, access resources, and research topics discussed
- Networking tools and techniques can be demonstrated in real-time
- You're prepared for any impromptu learning opportunities

### Technical Considerations

**Laptop Setup:**
- Ensure your device is charged or bring a charger
- Have a basic security toolkit if you have one (not required)
- Consider bringing a notebook for offline notes
- Make sure your WiFi works (though venue WiFi may be limited)

**Security Awareness:**
- Be mindful of what's visible on your screen in public
- Don't access sensitive personal accounts on unfamiliar networks
- Consider using a dedicated "meetup" user account if you're particularly security-conscious

## Making the Most of Your First Experience

### Initial Interactions

**Simple Introductions:**
- "Hi, I'm [name]. This is my first DEFCON meetup."
- Share your background briefly—student, career changer, current role
- Mention what sparked your interest in cybersecurity
- Ask about others' experiences and how they got started

**Conversation Starters:**
- "What's the most interesting thing you've learned recently?"
- "How did you get into cybersecurity?"
- "What projects are you working on?"
- "Any recommendations for someone just getting started?"

### Participation Guidelines

**Active Listening:**
- Focus on understanding others' perspectives and experiences
- Ask follow-up questions that show genuine interest
- Take mental (or written) notes about resources people mention
- Remember names and details for future conversations

**Contributing Appropriately:**
- Share your learning journey and challenges
- Ask for advice or recommendations
- Offer help with topics where you have experience (even if limited)
- Don't try to impress; focus on genuine interaction

## The In-Person Advantage

### Why Physical Meetups Matter

**Authentic Connection:**
- Body language and personal presence create deeper relationships
- Casual conversations during breaks often yield the most valuable insights
- Mentorship relationships develop more naturally face-to-face
- Trust and rapport build more quickly in person

**Collaborative Learning:**
- Screen sharing and live demonstrations are more effective
- Group problem-solving sessions work better physically
- Hands-on activities and workshops require physical presence
- Spontaneous collaboration happens more easily

**Community Building:**
- Shared experiences create stronger community bonds
- Local networking leads to real opportunities
- Group dynamics and culture are established through in-person interaction
- Long-term friendships and professional relationships begin with face-to-face meetings

## After Your First Meetup

### Follow-Up Actions

**Immediate (Within 24 Hours):**
- Connect with people you met on LinkedIn or community platforms
- Send brief follow-up messages referencing your conversations
- Save any resources, links, or recommendations shared with you
- Reflect on what you learned and what interested you most

**Short-Term (Within a Week):**
- Research topics that came up in discussions
- Try tools or techniques that were demonstrated
- Join any recommended online communities or resources
- Plan to attend the next meetup

### Building on the Experience

**Continued Engagement:**
- Become a regular attendee to build deeper relationships
- Gradually increase your participation and contribution
- Share your learning progress with the community
- Look for ways to help other newcomers

**Expanding Your Involvement:**
- Volunteer to help with meetup organization
- Offer to present on topics you've learned
- Suggest speakers or topics based on community interests
- Participate in group projects or research initiatives

## Conclusion

Your first DEFCON Group meetup is the beginning of your integration into the local cybersecurity community. Remember: just show up with a good attitude, bring your computer for hands-on learning, and embrace the experience. The most important thing is your presence and willingness to engage. Everything else—expertise, contributions, leadership—will develop naturally through continued participation.

The in-person nature of these meetups is what makes them special. While digital communication has its place, there's no substitute for the energy, collaboration, and genuine connection that happens when cybersecurity enthusiasts gather in the same room. Your first meetup is the first step in a journey that could define your career and introduce you to lifelong friends and mentors.

Welcome to the community—we look forward to meeting you at the next meetup!`,

  'giving-a-talk.md': `# Giving a Talk

## Everyone Has Something to Contribute

Presenting at DEFCON Group meetups is **highly encouraged** for all community members, regardless of your professional background or experience level. Whether you're a software developer, lawyer, hacker, businessman, student, or from any other field entirely—your unique perspective and experiences have value for the community.

## Breaking Down Professional Barriers

### Your Background Doesn't Define Your Contribution

**Software Developers:**
- Share development security practices and secure coding techniques
- Discuss vulnerabilities you've encountered and how you addressed them
- Present on tools you've built or security-focused projects
- Explain how developers can think like attackers

**Lawyers:**
- Present on cybersecurity law, compliance, and legal frameworks
- Discuss incident response from a legal perspective
- Share insights on privacy regulations and data protection
- Explain legal implications of security research and disclosure

**Business Professionals:**
- Talk about cybersecurity from a risk management perspective
- Share experiences with security budgeting and resource allocation
- Present on security awareness and training programs
- Discuss the business impact of security incidents

**Traditional Hackers and Security Professionals:**
- Share technical research and vulnerability discoveries
- Demonstrate tools and techniques
- Present on penetration testing methodologies
- Discuss threat intelligence and attack trends

**Students and Career Changers:**
- Share your learning journey and resources that helped you
- Present on research projects or academic studies
- Discuss certification experiences and study strategies
- Talk about transitioning into cybersecurity from other fields

**Any Other Background:**
- Every profession has unique security challenges and perspectives
- Your industry knowledge combined with security awareness creates valuable insights
- Cross-disciplinary approaches often lead to innovative solutions
- Fresh perspectives challenge conventional thinking

## The Power of Diverse Perspectives

### Why Every Voice Matters

**Cross-Pollination of Ideas:**
- Business professionals understand risk in ways technical people might miss
- Lawyers see regulatory implications that hackers might overlook
- Developers understand implementation challenges that researchers might not consider
- Students bring fresh approaches unencumbered by industry assumptions

**Real-World Applications:**
- Different backgrounds provide context for how security affects various industries
- Practical implementation stories from non-security professionals are invaluable
- Business cases and ROI discussions help justify security investments
- Legal frameworks provide necessary boundaries for ethical practice

**Community Building:**
- Diverse speakers create a more inclusive and welcoming environment
- Different communication styles reach different learning preferences
- Varied backgrounds attract a broader audience to the community
- Cross-professional networking creates unexpected opportunities

## No Formal Process Required

### Simplicity by Design

**No Committee Reviews:**
- No need to submit abstracts or proposals
- No approval process or content screening
- No formal evaluation of your qualifications
- No requirement to be an "expert" on your topic

**No Rigid Scheduling:**
- Presentations happen organically based on availability and interest
- You choose when you're ready to present
- Flexible timing accommodates your preparation needs
- Natural flow allows for spontaneous presentations

**No Formal Requirements:**
- No specific format or template to follow
- No minimum or maximum time limits (though being considerate of others is appreciated)
- No requirement for slides or visual aids
- No dress code or presentation style mandates

### Just Be Ready and Take Your Turn

**When You're Ready:**
- Prepare your content to your own standards
- Choose a topic you're genuinely interested in sharing
- Pick a time when you feel confident and prepared
- Wait for a natural opportunity during meetups

**Taking Your Turn:**
- Let the meetup organizer know you'd like to present
- Speak up when there's an opening in the schedule
- Offer to present when someone asks "anyone want to share something?"
- Step forward when you have something timely or relevant to contribute

**Organic Presentation Flow:**
- Presentations often happen in response to group discussions
- Someone shares a problem, you might offer to present your solution next time
- Current events or recent experiences make for timely presentations
- Questions from the community can inspire future presentations

## Presentation Formats and Styles

### Flexible Approaches

**Formal Presentations:**
- Traditional slide-based talks with structured content
- Research presentations with methodology and findings
- Tool demonstrations with prepared examples
- Case studies with detailed analysis

**Informal Sharing:**
- Storytelling about experiences and lessons learned
- Group discussions facilitated by your expertise
- Q&A sessions where you field questions about your area
- Problem-solving sessions where you guide the group through challenges

**Interactive Sessions:**
- Hands-on workshops where participants follow along
- Live demonstrations of tools or techniques
- Collaborative troubleshooting of real problems
- Group exercises and learning activities

**Lightning Talks:**
- Quick 5-10 minute presentations on specific topics
- Rapid sharing of tips, tools, or insights
- Brief updates on ongoing projects or research
- Fast-paced introductions to new concepts

## Getting Started With Your First Presentation

### Choosing Your Topic

**Start With What You Know:**
- Share a recent project or work experience
- Discuss a problem you've solved and how you approached it
- Present on tools or techniques you use regularly
- Talk about your journey into cybersecurity

**Consider Your Audience:**
- What would have helped you when you were starting out?
- What unique perspective does your background provide?
- What questions do people regularly ask you about your field?
- What misconceptions about your profession could you clarify?

**Topic Ideas by Background:**
- **Developers:** "Security bugs I've found and fixed," "Building security into the development process"
- **Lawyers:** "Legal basics every hacker should know," "Incident response from a legal perspective"
- **Business:** "Getting security budget approved," "Explaining technical risks to executives"
- **Students:** "My cybersecurity learning path," "Academic research that applies to real-world security"

### Preparation Strategies

**Content Development:**
- Outline your main points and supporting details
- Include real examples and stories from your experience
- Prepare for questions by anticipating what people might ask
- Consider what resources or references you want to share

**Practice and Rehearsal:**
- Run through your presentation at least once
- Time yourself to ensure appropriate length
- Practice with friends or colleagues if possible
- Prepare for technical demonstrations in advance

**Resource Preparation:**
- Gather any tools, links, or references you want to share
- Prepare handouts or follow-up materials if appropriate
- Test any technical demonstrations or live coding
- Have backup plans for technology failures

## Making Your Presentation Valuable

### Focus on Practical Value

**Share Real Experiences:**
- Authentic stories resonate more than theoretical discussions
- Mistakes and failures often teach more than successes
- Practical challenges and solutions provide immediate value
- Personal insights help others learn from your journey

**Make It Actionable:**
- Provide specific steps people can take
- Share resources and tools that others can use
- Give clear recommendations based on your experience
- Offer to help others implement what you've shared

**Encourage Interaction:**
- Ask questions and encourage audience participation
- Leave time for Q&A and discussion
- Be open to different perspectives and approaches
- Create opportunities for follow-up conversations

### Building Community Through Presentations

**Foster Learning:**
- Create safe spaces for questions and admission of ignorance
- Explain concepts at multiple levels to reach different experience levels
- Connect your topic to broader cybersecurity principles
- Help others see how your field relates to their interests

**Encourage Others:**
- Model vulnerability by sharing challenges and failures
- Show that expertise comes from experience, not innate ability
- Demonstrate that everyone has valuable knowledge to share
- Inspire others to present by showing the value of diverse perspectives

## Conclusion

Every member of our community has unique experiences, perspectives, and knowledge that can benefit others. Your professional background—whether in software development, law, business, or any other field—provides a valuable lens through which to view cybersecurity challenges and solutions.

There's no formal process to navigate, no committee to convince, and no credentials to prove. Simply prepare something you're passionate about sharing, wait for your turn, and contribute to our collective learning. The community grows stronger when we hear from diverse voices and varied experiences.

The most important thing is your willingness to share and contribute. Your first presentation doesn't need to be perfect—it just needs to be genuine and helpful. Step forward when you're ready, take your turn, and add your voice to our community's ongoing conversation about cybersecurity.

We look forward to hearing your unique perspective!`
};

const Blog = () => {
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [postContent, setPostContent] = useState('');
  const [loading, setLoading] = useState(false);

  // Initialize posts from embedded content
  useEffect(() => {
    const loadEmbeddedPosts = () => {
      const discoveredPosts = [];
      let postId = 1;
      
      Object.entries(EMBEDDED_POSTS).forEach(([filename, content]) => {
        const metadata = extractMetadataFromMarkdown(content, filename, postId);
        discoveredPosts.push(metadata);
        postId++;
      });
      
      // Sort posts by date (newest first)
      discoveredPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
      setPosts(discoveredPosts);
    };

    loadEmbeddedPosts();
  }, []);

  // Extract metadata from markdown frontmatter or content
  const extractMetadataFromMarkdown = (content, filename, id) => {
    const lines = content.split('\n');
    let metadata = {
      id: id,
      filename: filename,
      title: filename.replace('.md', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      date: new Date().toISOString().split('T')[0],
      author: 'DefCon Belgrade',
      excerpt: '',
      tags: ['blog']
    };

    // Check for frontmatter (YAML between --- lines)
    if (lines[0] === '---') {
      const frontmatterEnd = lines.findIndex((line, index) => index > 0 && line === '---');
      if (frontmatterEnd > 0) {
        const frontmatterLines = lines.slice(1, frontmatterEnd);
        frontmatterLines.forEach(line => {
          const [key, ...valueParts] = line.split(':');
          if (key && valueParts.length > 0) {
            const value = valueParts.join(':').trim().replace(/['"]/g, '');
            switch (key.toLowerCase()) {
              case 'title':
                metadata.title = value;
                break;
              case 'date':
                metadata.date = value;
                break;
              case 'author':
                metadata.author = value;
                break;
              case 'excerpt':
                metadata.excerpt = value;
                break;
              case 'tags':
                metadata.tags = value.split(',').map(tag => tag.trim());
                break;
            }
          }
        });
      }
    }

    // If no excerpt in frontmatter, extract from content
    if (!metadata.excerpt) {
      const contentWithoutFrontmatter = lines.slice(lines[0] === '---' ? 
        lines.findIndex((line, index) => index > 0 && line === '---') + 1 : 0);
      
      const contentLines = contentWithoutFrontmatter.filter(line => 
        !line.startsWith('#') && 
        line.trim().length > 0
      );
      
      if (contentLines.length > 0) {
        metadata.excerpt = contentLines[0].substring(0, 150) + (contentLines[0].length > 150 ? '...' : '');
      }
    }

    return metadata;
  };

  const loadPost = (post) => {
    setLoading(true);
    
    // Get content directly from embedded posts
    const content = EMBEDDED_POSTS[post.filename];
    if (content) {
      setPostContent(content);
    } else {
      setPostContent(`# Post Not Found\n\nThe post "${post.filename}" could not be found in the embedded content.`);
    }
    
    setLoading(false);
  };

  const selectPost = (post) => {
    setSelectedPost(post);
    loadPost(post);
  };

  const goBack = () => {
    setSelectedPost(null);
    setPostContent('');
  };

  return (
    <div>
      <MatrixNavbar />
      <div className="blog-container">
        {!selectedPost ? (
          // Blog post list
          <div className="blog-list">
            <div className="blog-header">
              <h1 className="blog-title">Getting Started With DC381</h1>
              <p className="blog-subtitle">
                Read your first philes bellow.
              </p>
            </div>
            
            <div className="posts-grid">
              {posts.map(post => (
                <article key={post.id} className="post-card" onClick={() => selectPost(post)}>
                  <div className="post-header">
                    <h2 className="post-title">{post.title}</h2>
                    <div className="post-meta">
                      <span className="post-date">{post.date}</span>
                      <span className="post-author">by {post.author}</span>
                    </div>
                  </div>
                  
                  <p className="post-excerpt">{post.excerpt}</p>
                  
                  <div className="post-tags">
                    {post.tags.map(tag => (
                      <span key={tag} className="tag">#{tag}</span>
                    ))}
                  </div>
                  
                  <div className="read-more">
                    <span>Read more →</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : (
          // Selected blog post
          <div className="blog-post">
            <button className="back-button" onClick={goBack}>
              ← Back
            </button>
            
            <div className="post-content">
              {loading ? (
                <div className="loading">Loading post...</div>
              ) : (
                <div className="markdown-content">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight, rehypeRaw]}
                  >
                    {postContent}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Blog;