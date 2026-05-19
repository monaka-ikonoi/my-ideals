# My Ideals - Track your Namashashin collections

[English](./README.en.md) | [日本語](./README.ja.md) | [中文](./README.zh.md)

My Ideals is a web app for managing your idol photo (生写真 / Namashashin) collection.

- ✅ Check off photos you own, or record quantities in **Count mode**
- 💗 Mark **wanted** items by entering a **negative value** in Count mode
- 📊 View progress at a glance (per collection, per member)
- 🔍 Quick search, filter by member and status, hide completed collections
- 🖼️ Export your selection as an **image** for easy sharing
- 🔄 Automatic detection of template updates
- 💾 Data stored in your browser - no account required

## Quick Start

### ⚠️ Warning

All data is stored locally in your browser only (IndexedDB / localStorage). Clearing browser data, using incognito mode, or switching devices will result in permanent data loss. Please export backups regularly. **The developer is not responsible for any losses caused by data loss and cannot help recover lost data.**

> iOS / iPadOS / Safari users: due to Apple ITP, local data may be automatically cleared after 7 days of inactivity. Export a backup after each session.

https://my-ideals.notequal.me/

### Create a Profile

1. From the menu below, select **"New Profile"**.
   - **On PC**: click the dropdown list in the top-right corner
   - **On mobile**: tap the three-line (hamburger) menu in the top-right corner
2. Paste the template URL (obtained from [here](https://github.com/monaka-ikonoi/my-ideals/issues/1) or the template creator)
3. Enter a profile name
4. To record **quantities**, enable **"Count mode"** (you can switch this later from the profile menu)
5. Click **"Create"**

### Search & Filter

- Use the search box to quickly find collections by name
- Tap the **member filter** to show only specific members (useful for multi-member templates)
- Use the **status filter** to show All / Owned / Unowned / Wanted
- Toggle **"Hide completed collections"** to focus on what's left

### Track Your Collection

1. Browse through the collections
2. Click any item to mark it as **owned** ✓
3. In **Count mode**, you can record the quantity for each item; entering a **negative value** marks it as **wanted** 💗 (not available in Standard mode)
4. Progress is saved automatically

### Manage Profiles

- Create **multiple profiles** (e.g., per group, for trading, etc.)
- From the profile menu you can **rename**, **duplicate**, **reorder**, or **delete** profiles
- When the template author publishes an update, the app shows a **template diff** (added / removed items) and lets you choose to keep or clean up removed data
- If the template URL becomes invalid, use **"Edit Template URL"** to update it

### Backup & Share

- Click **"Export"** in the top-right corner to download your profile data file (JSON); you can import it on another device to restore
- Use **"Generate Image"** to export selected collections as a single image, ideal for sharing on social media

## How It Works

**Template** = A photo list created by the community

A template defines what photos exist in a set (e.g., "2024 Summer Concert Goods"). Template creators maintain these lists so you don't have to manually enter each item. Just paste a template URL to get started.

**Profile** = Your personal collection tracker

A profile uses a template and records which items you own (and the quantity, in Count mode). You can have multiple profiles.

```
Template (shared)       Profile (yours)
┌─────────┐            ┌─────────┐
│ A       │            │ A    ✓  │  ← owned
│ B       │    -->     │ B   ×2  │  ← Count mode: 2 owned
│ C       │            │ C   -1💗│  ← Count mode: negative = wanted
│ ...     │            │ ...     │
└─────────┘            └─────────┘
```

## FAQ

**Q: Where is my data stored?**

A: All data is stored locally in your browser (IndexedDB, falling back to localStorage on older environments). Nothing is sent to any server.

**Q: What if I clear my browser data?**

A: Your collection data will be lost. Always export a backup before clearing browser data. iOS / Safari users may also lose data after 7 days of inactivity due to ITP, even without manually clearing.

**Q: Can I use this on multiple devices?**

A: Yes, but data doesn't sync automatically. Export from one device and import on another.

**Q: What's the difference between Standard mode and Count mode?**

A: Standard mode records only "owned / not owned". Count mode records the quantity of each item. You can switch modes anytime from the profile menu, but switching from Count back to Standard will collapse quantities of 2 or more to 1.

**Q: What is a template?**

A: A template is a JSON file that defines the photo list. Template creators maintain these lists so users don't have to enter each item manually. When a template is updated, the app automatically detects it and shows you the diff.

**Q: The template URL doesn't work. What do I do?**

A: From the profile menu, click **"Edit Template URL"** to update the link. If the template has moved, get the new URL from the template creator.

**Q: How do I share my collection on social media?**

A: Use the **"Generate Image"** feature on the collection page to export selected collections as a single image.

## Links

- [Report Issues](https://github.com/monaka-ikonoi/my-ideals/issues)
